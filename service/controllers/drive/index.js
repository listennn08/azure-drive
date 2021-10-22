const fs = require('fs');
const { Router } = require('express');
const upload = require('multer')({ dest: 'uploads/' });
const { Observable } = require('rxjs');
const AdmZip = require('adm-zip');
const useDriveService = require('../../graph/drive');
const { catchUnhandlerError } = require('../utils');

const router = Router();

// prefix /api/drive
router.get('/folder/:id', async (req, res) => {
  const { id } = req.params;

  try {
  const driveService = useDriveService(
    req.app.locals.msalClient,
    req.session.userId,
  );

  const data = await driveService.getSpecificFolderItems(id)
  res.json(data);
  } catch(e) {
    catchUnhandlerError(res, e);
  }
});

router.post('/folder/new', async (req, res) => {
  const { parentId, name } = req.body;

  try {
    const driveService = useDriveService(
      req.app.locals.msalClient,
      req.session.userId,
    );

    const data = await driveService.createFolder(parentId, name);
    res.json(data);
  } catch(e) {
    catchUnhandlerError(res, e);
  }
});

router.post('/file/upload', upload.array('file'), async (req, res) => {
  if (!req.files.length) return res.json({ message: 'No file!' });
  
  const { parent } = req.body;
  const { files } = req;
  const respData = [];

  try {
    const driveService = useDriveService(
      req.app.locals.msalClient,
      req.session.userId,
    );

    const handleSubscribers = (subscriber) => {
      (async (sub) => {
        for (let i = 0; i < files.length; i += 1) {
          console.log(files[i])
          const { originalname, path } = files[i]
          const result = await driveService.uploadFiles(parent, originalname, path);

          respData.push(result);
          sub.next({
            path,
            sub: i === files.length - 1 ? sub : null,
          });
        }
      })(subscriber);
    }

    // 建立可觀察物件
    const data$ = new Observable(handleSubscribers);

    // 訂閱 data$ 在每次處理完成之後刪除檔案
    data$.subscribe({
      next: ({ path, sub }) => {
        fs.unlinkSync(path);
        if (sub) sub.complete();
      }, 
      error: (err) => {
        console.error(err);
        res.send(err);
      },
      complete: () => res.send(respData),
    });
  } catch(e) {
    catchUnhandlerError(res, e);
  }
});

router.post('/rename', async (req, res) => {
  const { id, name } = req.body;

  try {
    const driveService = useDriveService(
      req.app.locals.msalClient,
      req.session.userId,
    );

    const data = await driveService.renameItem(id, name);
    res.send(data);
  } catch(e) {
    catchUnhandlerError(res, e);
  }
});

router.delete('/:id',async (req, res) => {
  const { id } = req.params;
  
  try {
    const driveService = useDriveService(
      req.app.locals.msalClient,
      req.session.userId,
    );

    const data = await driveService.deleteItem(id);
    res.send(data)
  } catch(e) {
    catchUnhandlerError(res, e);
  }
});

router.get('/file/:id/:filename/download', async (req, res) => {
  const { id, filename } = req.params;

  try {
    const driveService = useDriveService(
      req.app.locals.msalClient,
      req.session.userId,
    );

    // 回傳格式為 Blob 需轉成 buffer。
    const result = await driveService.downloadItem(id);

    res.writeHead(200, {
      'Content-Type': result.type,
      'Content-disposition': 'attachment;filename=' + filename,
    });
    res.end(Buffer.from(await result.arrayBuffer(), 'binary'));

  } catch(e) {
    catchUnhandlerError(res, e);
  }
});

router.post('/file/all/download', async (req, res) => {
  const { folderName, links } = req.body;
  try {
    const driveService = useDriveService(
      req.app.locals.msalClient,
      req.session.userId,
    );
    const data$ = await driveService.downloadAllItems(links);

    const zip = new AdmZip();
    data$.subscribe({
      next: async ({ name, result, sub }) => {
        console.log(result)
        zip.addFile(name, Buffer.from(await result.arrayBuffer(), 'binary'))
        if (sub) sub.complete();
      },
      error: (err) => console.error(err),
      complete: () => {
        res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-disposition': `attachment;filename=${folderName}`,
        });
        res.end(zip.toBuffer());
      },
    })
  } catch(e) {
    console.error(e);
  }
})

module.exports = router;