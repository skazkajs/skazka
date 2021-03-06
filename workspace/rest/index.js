const App = require('@skazka/server');
const Router = require('@skazka/server-router');

const http = require('@skazka/aws/lambda/http');

const init = require('@skazka/server-init');
const bodyParser = require('@skazka/server-body-parser');
const cors = require('@skazka/server-cors');

const app = new App();
const router = new Router();

const users = [];

app
  .then(init({ error: { isJSON: true } }))
  .then(cors());

router.get('/').then((ctx) => ctx.redirect('/users'));

router.get('/users').then((ctx) => ctx.response(users));

router.post('/users').then(async (ctx) => {
  await bodyParser.json(ctx);

  users.push(ctx.request.body);

  return ctx.response({ message: 'User saved' });
});

app.then(router.resolve());

module.exports = http(app);
