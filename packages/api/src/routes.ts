import * as Router from "koa-router";
import { createIndicatorsData, getIndicatorsData, updateIndicatorsData } from './controller';

const routeOptions: Router.IRouterOptions = {
    prefix: '/api'
}

export const router = new Router(routeOptions);
router.post('/indicators-datas', createIndicatorsData);
router.put('/indicators-datas', updateIndicatorsData);
router.get('/indicators-datas/:id', getIndicatorsData);