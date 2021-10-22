require('dotenv').config();

const fs = require('fs')
const path = require('path')
const express = require('express');
const msal = require('@azure/msal-node');
const session = require('express-session');
const logger = require('morgan');
const authRouter = require('./service/controllers/auth');
const userRouter = require('./service/controllers/user');
const driveRouter = require('./service/controllers/drive');
const siteRouter = require('./service/controllers/site');
const { visitGuard } = require('./service/middleware/guard');

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD
const PORT = process.env.PORT || 3000;

async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production'
) {
  const resolve = (p) => path.resolve(__dirname, p);

  const indexProd = isProd
    ? fs.readFileSync(resolve('dist/client/index.html'), 'utf-8')
    : '';

  const manifest = isProd
    ? require('dist/client/ssr-manifest.json')
    : {};

  const app = express();

  app.locals.users = {};

  let vite;
  if (!isProd) {
    vite = await require('vite').createServer({
      root,
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: 'ssr',
        watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          usePolling: true,
          interval: 100
        }
      }
    });
    // use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    app.use(require('compression')());
    app.use(
      require('serve-static')(resolve('dist/client'), {
        index: false
      })
    );
  }

  const config = {
    auth: {
      clientId: process.env.CLIENT_ID,
      authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}/`,
      clientSecret: process.env.CLIENT_SECRET
    },
    system: {
      loggerOptions: {
        loggerCallback(loglevel, message, containsPii) {
          console.log(message);
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Verbose,
      },
    },
  };
  
  app.locals.msalClient = new msal.ConfidentialClientApplication(config);
  
  app.use(session({
    secret: 'pwc',
    resave: false,
    saveUninitialized: false,
    unset: 'destroy',
  }));
  
  app.use(visitGuard);
  app.use(logger('dev'));
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  app.get('/api', async (req, res) => {
    return res.send('api doc')
  })
  
  app.use('/api', authRouter);
  app.use('/api/user', userRouter);
  app.use('/api/drive', driveRouter);
  app.use('/api/site', siteRouter);
  

  app.use('/', async (req, res) => {
    try {
      const url = req.originalUrl

      let template, render
      if (!isProd) {
        // always read fresh template in dev
        template = fs.readFileSync(resolve('index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        render = (await vite.ssrLoadModule('/src/entry-server.js')).render
      } else {
        template = indexProd
        render = require('./dist/server/entry-server.js').render
      }

      const [appHtml, preloadLinks] = await render(url, manifest)

      const html = template
        .replace(`<!--preload-links-->`, preloadLinks)
        .replace(`<!--app-html-->`, appHtml)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite && vite.ssrFixStacktrace(e)
      console.log(e.stack)
      res.status(500).end(e.stack)
    }
  })

  return { app, vite }
}

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(PORT, () => {
      console.log(`http://localhost:${PORT}`)
    })
  )
}

// for test use
exports.createServer = createServer