const { FileUpload, OneDriveLargeFileUploadTask } = require('@microsoft/microsoft-graph-client');
const fs = require('fs');
const { Observable } = require('rxjs');
const { getAuthticationClient } = require('./utils');

function useDriveService(msalClient, userId) {
  const client = getAuthticationClient(msalClient, userId);

  async function getSpecificFolderItems(folderId) {
    const path = folderId === 'root' ? 'root' : `items/${folderId}`;
    const driveRootList = await client
      .api(`/me/drive/${path}/children`)
      .get();
    
    // const driveRootList = await client.api('/me/drive/sharedWithMe').get()
    return driveRootList;
  }

  async function createFolder(parentId, name) {
    const driveItem = {
      name,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename',
    };

    const path = parentId === 'root' ? 'root' : `items/${parentId}`;
    const result = await client
      .api(`/me/drive/${path}/children`)
      .post(driveItem);

    return result;
  }

  async function uploadFiles(parent, originalname, path) {
    const { id: parentId, name: parentName } = JSON.parse(parent);
    const options = {
      path: parentId === 'root' ? '/' : `/${parentName}`,
      fileName: originalname,
      rangeSize: 1024 * 1024,
      uploadEventHandlers: {
        progress: (range, e) => {
          console.log(`Upload ${range.minValue} to ${range.maxValue}`);
        },
      },
    };

    try {
      const file = fs.readFileSync(path);
      const size = file.length / (1024 * 1024);
      console.log(size)
      if (size > 4) {
        try {
          const fileObject = new FileUpload(file, originalname, file.length);
          const uploadTask = await OneDriveLargeFileUploadTask
            .createTaskWithFileObject(client, fileObject, options);

          const uploadResult = await uploadTask.upload()
          const driveItem = uploadResult.responseBody
          console.log(`Uploaded file with ID: ${driveItem.id}`);
          return driveItem;
        } catch(e) {
          console.error(e);
          console.log(`Error uploading file: ${JSON.stringify(e)}`);
        }
      }

      const apiPath = parentId === 'root' ? 'root' : `items/${parentId}`;

      const result = await client
        .api(`/me/drive/${apiPath}:/${originalname}:/content`)
        .put(file);

      return result
    } catch (e) {
      console.error(e);
    }
  }

  async function renameItem(id, name) {
    try {
      const result = await client.api(`/me/drive/items/${id}`).update({ name });

      return result;
    } catch(e) {
      console.error(e);
    }

  }

  async function deleteItem(id) {
    const result = await client
      .api(`/me/drive/items/${id}`)
      .delete()

    return result;
  }

  async function downloadItem(id, size) {
    try {
      if (size / (1024 * 1024) > 4) {
        const respData = [];
        for (let i = 1; i < size; i += (1024 * 1024)) {
          const result = await client.api(`/me/drive/items/${id}/`)
            .header('Range', `byte=${i - 1}-${(i + 1) * (1024 * 1024)}`)
            .get()
          
          respData.push(result)
        }

        return respData
      }
      const result = await client.api(`/me/drive/items/${id}/content`)

        .get();

      return result
    } catch(e) {
      console.error(e);
    }
  }

  async function downloadAllItems(items) {
    const handleSubscribers = (subscriber) => {
      (async (sub) => {
        for (let i = 0; i < items.length; i += 1) {
          const result = await client
            .api(`/me/drive/items/${items[i].id}/content`)
            .get();
          
          sub.next({
            name: items[i].name,
            result,
            sub: i === items.length - 1 ? sub : null,
          });
        }
      })(subscriber)
    }

    const data$ = new Observable(handleSubscribers);

    return data$;
  }

  return {
    getSpecificFolderItems,
    createFolder,
    uploadFiles,
    renameItem,
    deleteItem,
    downloadItem,
    downloadAllItems,
  };
}

module.exports = useDriveService