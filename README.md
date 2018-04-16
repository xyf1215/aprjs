# 动机

​	在开发中经常会遇到一段程序写完测试通过并上线，之后这段程序又提出新的需求，这时候是继续去完善这个程序来扩大它的职责是不是最佳实践？毕竟遇到历史已经的程序我们需要话费一些成本去review，例如这样一个简单例子——视图上有一个保存按钮，点击之后进行“保存文章”操作，并在调用ajax之前与之后以及报错后都记录一下：

```javascript
// view
/*
<button type="button" onclick="savePost(form)">保存</button>
*/

// js
function async savePost(form) {
  log('开始保存文章', form)
  try {
    await ajax('/post/add', form)
    log('增加成功')
  } catch (e) {
    log('操作失败', e.message)
  }
}
```

​	很完善的逻辑，并且很好阅读，但是过了一段时间后，“保存文章”操作增加了一个新的需求：**在保存之前需要将文章的部分敏感词过替换为"*"**，顺理成章，立马有了以下解决办法：

```javascript
// view
/*
<button type="button" onclick="savePost(form)">保存</button>
*/

// js
function async replaceWords(body) {
  const words = await ajax('/word/list')
  words.forEach(word => body.replace(word, '*'))
  return body
}

function async savePost(form) {
  log('开始保存post', form)
  replaceWords(form.body)
  try {
    await ajax('/post/add', form)
    log('增加成功')
  } catch (e) {
    log('操作失败', e.message)
  }
}
```

​	好了，需求完成，经过测试然后上线，不巧的是过了一段时间，又来一个需求：**在点击保存操作时，不管保存成功与否需要将文章中的tags保存**

​	so，继续完善这段程序：

```javascript
// view
/*
<button type="button" onclick="savePost(form)">保存</button>
*/

// js
function async replaceSensitiveWords(body) {
  const words = await ajax('/word/list')
  words.forEach(word => body.replace(word, '*'))
  return body
}

function async savePost(form) {
  log('开始保存post', form)
  replaceSensitiveWords(form.body)
  try {
    await ajax('/post/add', form.body)
    log('增加成功')
  } catch (e) {
    log('操作失败', e.message)
  }
}

function async saveTags(tags) {
  log('开始保存tag', tags)
  try {
    await ajax('/tag/add', tags)
    log('增加成功')
  } catch (e) {
    log('操作失败', e.message)
  }
}

function save(form) {
  saveTags(form.tags)
  savePost(form)
}
```

​	上线之后，再重新review这段代码时，发现这种逻辑的编写，因为没有通用的实践方式，我们的代码越来越复杂，也越来越难以维护，我们能否提炼出一种通用的编程模式呢？

# 编程模型

### 现有方案

​	通过之前的例子演示，发现在新增代码时我们需要回顾原有逻辑，并且小心的在原有代码各处主动触发新加的逻辑，但是这样增加了调试的难度以及对影响程序的健壮性，所以我们需要提取一种模式来避免修改原有代码也能达到同样的效果。

> AOP是Java中常用的编程模式，即：面向切面编程，通过预编译方式和运行期动态代理实现程序功能的统一维护的一种技术。

​	Spring(Java中的Web框架)的AOP有两种实现，一种是指定after/before模式，可在目标程序执行之前、之后进行代理。而around则是after/before的总和，around甚至可以决定目标方法在什么时候执行，如何执行，更甚者可以完全阻止目标方法的执行。但是放在JS中，我们只能考虑around模式，因为需要处理异步的情况，而在Java中，多线程阻塞式变成更为常见。

​	简单的around和after/before实现：

```java
public class PointCuts {
    public void aopDemo() {
			System.out.println("aop Demo");
    }
}

@Aspect
public class Aspect {
    @Before(value = "aopDemo()")
    public void before(JoinPoint joinPoint) {
        System.out.println("before");
    }

    @After(value = "aopDemo()")
    public void after(JoinPoint joinPoint) {
        System.out.println("after");
    }
  
    @Around(value = "aopDemo()")
    public void around(ProceedingJoinPoint joinPoint) throws Throwable{
        System.out.println("around before");
        joinPoint.proceed();
        System.out.println("around after");
    }
}

// 全部输出：
// around before
// before
// aop Demo
// around after
// after

// 如果只有around
// around before
// aop Demo
// around after
```

​	并且around还能再次around，所以我们理一下，在进入之前到达around，然后around手动调用目标程序，目标程序结束后再回到around，**around before -> 目标程序 -> around after**，你可以已经发现什么了，没错和洋葱模型是一样的。

![洋葱模型](http://xyf-resources.oss-cn-beijing.aliyuncs.com/18-4-16/98345827.jpg)

​	和洋葱模型不同的是，洋葱的层次一层包着一层，如果在一个层次中进行多个并发（异步）任务的话，在洋葱需要我们手写代码去实现。所以引入了类似Java中的future概念，即：当一个方法有多个环绕时，需要等到多个环绕同事next之后再将执行权传递给下个联调中的方法。

### 实现

​	通过以上各种需求的变换，我们提炼了以下编程模式并有了apr.js的实现：

```javascript
// view
/*
<button type="button" onclick="apr.emit('save', form)">保存</button>
*/

apr.around('save:savePost', function async replaceWords(ctx, next) => {
  const words = await ajax('/word/list')
  words.forEach(word => ctx.req.body.replace(word, '*'))
  await next()
})

apr.around('save:savePost', function async addLog(ctx, next) => {
  log('开始保存post', ctx.req.form.body)
  try {
    await next()
    log('增加成功')
  } catch(e) {
    log('操作失败', e.message)
  }
})

apr.on('save', function savePost(ctx) {
  return ajax('/post/add', ctx.req.form.body)
})

apr.on('save', function saveTags(ctx) {
  return ajax('/tag/add', ctx.form.tags)
})
```

​	通过apr.js重写之后，发现各逻辑的职责非常简单，结构也工整一些，后来人来维护时自然的也会沿用这种模式进行编写。

### 调用链

​	再重新review以上代码，发现我们已经通过程序就已经能描述出整个程序的事件流了：

![调用链](http://xyf-resources.oss-cn-beijing.aliyuncs.com/18-4-16/76648498.jpg)



我们可以有序的组织调用链条，这些链条可以帮助我们理解程序执行的工程，并且稍加封装，我们可以将程序的每一步入参、出参都进行记录，方便后续调试。

甚至更进一步，我们可以将当前的状态进行序列号存储，然后通过序列号数据还原当时的场景。

### 中间件

todo...

# 同构

todo...