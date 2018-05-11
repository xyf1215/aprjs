# 一种基于事件流编程模式的实践与探索

## 动机

在开发中经常会遇到这种情景：一段程序写完测试通过并上线，之后又提出新的需求，这时是继续去完善这个程序来扩大它的职责，还是新写一段在原有程序进行调用，视乎两种方式都可，但究竟那种实践方式更好更易维护？接下来我们来探讨这个问题。

例如这样一个简单例子——视图上有一个保存按钮，点击之后进行“保存文章”操作，并在发送ajax之前与之后以及异常后都进行记录（为了简洁明了，代码都用es6进行编写）：

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

很完善的逻辑，并且很好阅读，但是过了一段时间后，“保存文章”操作增加了一个新的需求：**在保存之前需要将文章的部分敏感词过替换为"*"**，顺理成章，立马有了以下解决办法：

```javascript
// view
/*
<button type="button" onclick="savePost(form)">保存</button>
*/

// js
function async replaceWords(body) {
  const words = await ajax('/word/list')
  words.forEach(word => body = body.replace(word, '*'))
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

好了，需求完成，经过测试然后上线，不巧的是过了一段时间，又来一个需求：**在点击保存操作时，不管保存成功与否需要将文章中的tags保存**

so，继续完善这段程序：

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

上线之后，再重新review这段代码时，发现这种逻辑的编写，因为没有通用的实践方式（可以直接在原方法里扩展，或者单独增加方法进行调用），我们的代码开始产生Bad Smell，也越来越难以维护，我们能否提炼出一种通用的编程模式呢？

## 编程模式

通过之前的例子演示，发现在新增代码时我们需要review原有逻辑，并且小心的在原有代码各处主动触发新加的逻辑，这样快捷有效，但是增加了调试的难度以及影响程序的健壮性，所以我们需要提取一种模式来避免修改原有代码也能达到同样的效果的模式。通过反复的review发现AOP这种服务端的编程模式比较适合解决这个问题。

> AOP是Java中常用的编程模式，即：面向切面编程，通过预编译方式和运行期动态代理实现程序功能的统一维护的一种技术。

Spring（Java中最为流行的应用框架）的AOP有两种实现：

- Before/After：可在进入目标程序之前、以及之后进行切面。
- Around：对目标程序进行环绕，可在之前以及之后进行切面，并且可以决定目标方法在什么时候执行，如何执行，更甚者可以完全阻止目标方法的执行。

通过AOP的思路，我们发现在JS中，我们可以考虑使用Around模式来分离各个逻辑

> 为什么Around更合适？因为JS是单线程机制进行执行的，在进行多个任务处理时事件模型更为常见。而在Java中，多线程阻塞式更为常见。

下面是一段Java伪代码，来看看Around和Before/After的实现：

```java
public class PointCuts {
    public void aopDemo() {
			System.out.println("aop Demo");
    }
}

@Aspect
public class Aspect {
    @Before(value = "execution (PointCuts.aopDemo(..))")
    public void before(JoinPoint joinPoint) {
        System.out.println("before");
    }

    @After(value = "execution (PointCuts.aopDemo(..))")
    public void after(JoinPoint joinPoint) {
        System.out.println("after");
    }
  
    @Around(value = "execution (PointCuts.aopDemo(..))")
    public void around(ProceedingJoinPoint joinPoint) throws Throwable{
        System.out.println("around before");
      	Object[] args = joinPoint.getArgs();
        Object result = joinPoint.proceed(args);
        System.out.println("around after");
    }
}

// output：
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

我们重点来看Around，发现Around模式比Before/After代码更简单，并且Around还能再次Around。

所以我们理一下，在调用目标程序之前到达Around，然后通过Around手动调用目标程序，目标程序结束后再回到Around，Around before --> 目标程序 --> Around after。所以，**你是否已经发现什么了？没错，和洋葱模型是一样的。**

![洋葱模型](http://xyf-resources.oss-cn-beijing.aliyuncs.com/18-4-16/98345827.jpg)

虽然和洋葱模型类似，但是也有不太一样的地方：**洋葱一层包着一层，如果在一个层次中进行多个并发（派生出多个洋葱）任务，则需要并发同时达到后方可进行下个逻辑的调用。**在洋葱中我们需要手写代码去实现，并且需要自己处理异步到达的问题。

这个问题在Java中影响并不太大，因为Java中的调用大多都是阻塞的（实际上在Java中，多个线程调用中也可能需要考虑这个情况，在Java中可以使用CyclicBarrier）

> CyclicBarrier：字面意思回环栅栏，通过它可以实现让一组线程等待至某个状态之后再全部同时执行。

但是我们需要考虑JS中单线程执行的问题，所以我们需要自己处理异步到达的问题，我们也可以从CyclicBarrier的原理进行思考。所以梳理一下我们想要的：当一个方法有多个环绕时，需要等到多个环绕同时到达后再将执行权传递给下个链条中的方法。

## 实现

经过以上编程模式的思考，我们提炼了以下并有apr.js的实现：

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

通过apr.js进行重写逻辑之后，我们以事件模型的方式解决了目标逻辑的问题。其他扩充以及衍生逻辑实用Around进行环绕编程。和koa一样，设计了Context上下文来存储各个调用链的入参和出参。

## 探索*

### 调用链

再重新review以上代码，发现我们已经能通过程序就已经能描述出整个程序的调用链了：

![调用链](http://xyf-resources.oss-cn-beijing.aliyuncs.com/18-4-16/76648498.jpg)



我们可以有序的组织调用链，这些链条可以帮助我们理解程序调用过程，并且稍加封装，我们可以将程序的每一步入参、出参都进行记录，以方便后续调试。

在实践方便可以开发一个dev tools插件，实时的将联调的每一步同步到tools，绘制出整个程序执行的逻辑，帮助我们理清思路和调试。

### 状态

在现代前端技术工程化的发展中，当程序出现异常时，我们可以通过sourceMap快速知道出现异常的代码行位置，以方便我们调试。但是随着业务越来越大，异常情况五花八门，我们需要处理的数据也越来越多，虽然借助sourceMap能准确定位到代码行，但可能大部分情况下，我们还需要知道当时的执行上下文以及调用情况才能精确还原异常现场进行调试。

现在由于我们这种编程模型我们可精确的控制进入联调的实际，所以我们可以通过序列化当前的上下文情况以及调用链情况，快速的到达现场。

### 同构

自从NodeJS诞生以来，大家就开始在不同环境下共享JS的经验以及想法，以上编程模式也不例外，在浏览器和NodeJS他们工作的方式是一样的，所以我们理论上是可以屏蔽两端差异进行**无感交互**，考虑一下场景：

```javascript
// node
apr.on('save', ctx => {
  dao.insert(ctx.req.form)
})

// browser
apr.sync('http://localhost:8080/apr/init') // 同步node服务的apr事件流
apr.around('save', async async (ctx, next) => {
  log('before call')
  await next()
  log('after call')
})
apr.$emit('save', form)
```

cool，这种前后端交互灵感来自于GraphQl，在GraphQl中我们可以指定query来告诉后端我们想要的结果。

底层本身通过restful来传递信息，开发者本身无需关系restful状态，而只需要用我们的编程模式进行开发就能互联，这样完全打破传统思维去开发。

而在我们的编程模式中，我们可以把Context进行透传来实现无感交互。

GraphQl：

```json
request:
query {
  feed {
    url,
    description
  }
}

response:
{
  "data": {
    "feed": [
      {
        "url": "www.baidu.com",
        "description": "Test GraphQL"
      }
    ]
  }
}
```

我们可以看到底层的请求：

![](http://xyf-resources.oss-cn-beijing.aliyuncs.com/18-5-11/64664552.jpg)

但实际上，我们完全不用去关心底层请求从而实现与后端进行通讯。

## 总结

随着前端领域的发展，各个相关方向都已经建设的相当完善，但是在编程模式上，一直以来突破并不是很明显，近几年以来，由于Rx的出现一定程度上改变了JS编程模式的固有思维。探索无止尽，谨通过此篇，和大家探讨一种新的编程模式，欢迎大家拍砖斧正。

## 相关资料

[apr.js](https://github.com/xyf1215/aprjs)