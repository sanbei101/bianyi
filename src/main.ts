import { createApp } from "vue";

import "./style.css";
import App from "./ui/App.vue";
import router from "./ui/router";
const app = createApp(App);
app.use(router);

app.mount("#app");
