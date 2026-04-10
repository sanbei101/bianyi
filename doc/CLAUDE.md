当我让你写`typst`代码的时候,当你遇到不清楚的语法
请使用`context7`的`get-library-docs`工具获取文档
参数:
  - `context7CompatibleLibraryID`=`/websites/typst_app`
  - `topic`=`<你想要查询的语法主题>` #比如说`table`,`math`,`figure`等
  - `tokens`=`5000`
请记住,当时向使用一个可能在`latex`中出现的语法的时候,他在`typst`中可能并不存在!
所以请使用`context7`的`get-library-docs`工具获取文档了解后才能使用
你可以根据想要查询的语法主题来修改`topic`参数,多次使用`context7`的`get-library-docs`工具获取不同语法文档,直到你找到你想要的语法为止

还有如下注意点:
  - 不需要设置字体的参数