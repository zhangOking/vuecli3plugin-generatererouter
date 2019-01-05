## vue自动生成路由插件

脱胎于nuxtjs, 插件将会读取views中的.vue自动生成router/route.js文件

views文件中存放根组件，components中存放各页面的子组件

在项目根目录中新建router.js文件

```
import Vue from 'vue'
import Router from 'vue-router'

import { routes } from './router/route'

Vue.use(Router)

export default new Router({
  routes: routes
})
```

在终端中输入npm start或者yarn start启动项目即可

后续配置功能还在持续更新中

bug请联系10531897082qq.com
