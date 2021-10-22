import { ref, reactive, watch } from 'vue';
import axios from 'axios'

export function useHome() {
  const isLogin = ref(true);
  const currentPath = ref('root');

  const breadcrumbs = reactive([{
    id: 'root',
    name: 'root'
  }]);

  const isFolder = (f) => f.folder;

  const pathChange = (id, name) => {
    currentPath.value = id;
    const idx = breadcrumbs.findIndex((el) => el.name === name);

    if (idx > -1) {
      breadcrumbs.splice(idx + 1, breadcrumbs.length - idx);
    } else {
      breadcrumbs.push({ id, name });
    }
  }

  watch(currentPath, () => getData());

  const itemClick = (item) => {
    if (item.folder) {
      pathChange(item.id, item.name);
    }
  }

  const folderName = ref('');

  const uploadFiles = reactive([]);

  const updateFile = (e) => {
    e.preventDefault();
    [...e.target.files].forEach((el) => {
      uploadFiles.push(el);
    });
  }

  const removeFile = (idx) => {
    uploadFiles.splice(idx, 1)
  }

  const upload = async () => {
    const formData = new FormData();
    const folderName = breadcrumbs.find((el) => el.id === currentPath.value).name;
    formData.append('parent', JSON.stringify({
      id: currentPath.value,
      name: folderName,
    }));
    uploadFiles.forEach((el) => {
      formData.append('file', el);
    });

    
    try {
      await axios.post('/api/drive/file/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      uploadFiles.splice(0, uploadFiles.length);
      getData();
    } catch(e) {
      console.error(e);
    }
  }

  const fileList = reactive([]);
  const edit = reactive([]);

  const getData = async () => {
    try {
      fileList.splice(0, fileList.length);
      edit.splice(0, edit.length);

      const resp = await axios.get(`/api/drive/folder/${currentPath.value}`)
      fileList.push(...resp.data.value);
      edit.push(...new Array(fileList.length).fill(false));

      isLogin.value = true;
    } catch (e) {
      console.error(e);
      isLogin.value = false;
    }
  }

  const createFolder = async () =>  {
    try {
      const resp = await axios.post('/api/drive/folder/new', {
        parentId: currentPath.value,
        name: folderName.value,
      });

      console.log(resp);
      getData();
    } catch (e) {
      console.error(e);
    }
  }

  const deleteItem = async (id) => {
    try {
      const resp = await axios.delete(`/api/drive/${id}`);
      getData();
      console.log(resp);
    } catch (e) {
      console.error(e);
    }
  }

  const newItemName = ref('');

  const toggleRename = (idx, name) => {
    newItemName.value = name;
    edit[idx] = true;
  }

  const rename = async (id) => {
    try {
      const resp = await axios.post(`/api/drive/rename`, {
        id,
        name: newItemName.value,
      });

      console.log(resp);
      getData();
    } catch (e) {
      console.error(e);
    }
  }

  const downloadItem = async ({ id, name }) => {
    const resp = await axios.get(`/api/drive/file/${id}/${name}/download`, {
      responseType: 'blob'
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(resp.data);
    link.setAttribute('download', name); //or any other extension
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const downloadAllItms = async () => {
    const folderName = breadcrumbs.find((el) => el.id === currentPath.value).name;
    const links = fileList
      .filter((el) => !el.folder)
      .map(({ id, name }) => ({ id, name }));
    const resp = await axios.post('/api/drive/file/all/download',
      {
        folderName,
        links
      }, 
      {
        responseType: 'blob'
      }
    );
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(resp.data);
    link.setAttribute('download', `${folderName}.zip`); //or any other extension
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getData();

  return {
    currentPath,
    folderName,
    isLogin,
    uploadFiles,
    fileList,
    breadcrumbs,
    isFolder,
    itemClick,
    pathChange,
    getData,
    createFolder,
    updateFile,
    removeFile,
    upload,
    deleteItem,
    edit,
    newItemName,
    toggleRename,
    rename,
    downloadItem,
    downloadAllItms,
  };
}