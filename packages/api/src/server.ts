import * as cors from '@koa/cors';
import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as Router from 'koa-router';

const app = new Koa();

app.use(bodyParser());
app.use(cors());

const routeOptions: Router.IRouterOptions = {
    prefix: '/api'
}

const router = new Router(routeOptions);

router.get(`/hello-world`, (ctx: Koa.Context) => {
    ctx.status = 200;
    ctx.body = 'Hello World!!'
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(1337);