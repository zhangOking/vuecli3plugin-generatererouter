const creatRouter = require('./generateRouter/index')

module.exports = (api, projectOptions) => {
    api.configureWebpack(webpackConfig => {
        creatRouter.creatRouter(false)
    })
}
