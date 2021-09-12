import { createApp } from 'vue'
import App from './App.vue'

let app = createApp(App);


//--------- Auto Register Components ----------
import upperFirst from 'lodash/upperFirst'
import camelCase from 'lodash/camelCase'


// eslint-disable-next-line no-undef
const requireComponent = require.context(
    // The relative path of the components folder
    './components',
    // Whether or not to look in subfolders
    true,
    // The regular expression used to match base component filenames
    /\w+\.(vue|js)$/
  )
  
requireComponent.keys().forEach(fileName => {
// Get component config
const componentConfig = requireComponent(fileName)

// Get PascalCase name of component
const componentName = upperFirst(
    camelCase(
    // Gets the file name regardless of folder depth
    fileName
        .split('/')
        .pop()
        .replace(/\.\w+$/, '')
    )
)

// Register component globally
app.component(
    componentName,
    // Look for the component options on `.default`, which will
    // exist if the component was exported with `export default`,
    // otherwise fall back to module's root.
    componentConfig.default || componentConfig
)
})
//------------------------------------------
  
// import {ModuleRegistry} from '@ag-grid-community/core'
// import {ClientSideRowModelModule} from "@ag-grid-community/client-side-row-model";
// ModuleRegistry.registerModules([ClientSideRowModelModule]);

app.mount('#app')
