# 根据 Homework.md 做的作业

# 当前进度交接

## 当前项目路径与目标技术栈

项目路径：

`/Users/vincenthuang/web3-about/4-前端架构设计指南`

当前作业方案技术栈：

- 后端：`Hono`
- 本地运行：`@hono/node-server`
- 云端运行：`AWS Lambda + API Gateway`
- 基础设施部署：`AWS SAM`
- 数据库：`PostgreSQL`
- 云数据库：`RDS PostgreSQL`
- ORM：`Drizzle ORM`
- 自动部署：`GitHub Actions + IAM Role / OIDC`

## 已完成实现

当前已完成的功能：

- `GET /` 返回首页页面
- `GET /api/hello` 返回测试 JSON
- `GET /api/records` 查询数据库中的 GitHub 用户记录
- `POST /api/github-profile` 接收 GitHub token，调用 GitHub API 获取用户信息并写入数据库
- `DELETE /api/records/:id` 删除数据库记录

当前项目已经具备：

- Hono 路由入口
- Lambda 适配入口
- 本地 Node 启动入口
- Drizzle schema 和查询封装
- SAM 模板
- GitHub Actions 工作流
- 本地 Docker PostgreSQL 联调能力

## 关键文件位置

项目主说明：

- `README.md`

应用入口：

- `src/app.ts`
- `src/lambda.ts`
- `src/dev.ts`

页面与接口：

- 页面内容：`src/views/index.html`
- 首页路由：`src/routes/page.ts`
- API 路由：`src/routes/api.ts`

数据库相关：

- Drizzle schema：`src/db/schema.ts`
- 数据库客户端：`src/db/client.ts`
- 数据库查询封装：`src/db/queries.ts`

第三方 API：

- GitHub API 封装：`src/lib/github.ts`

部署相关：

- SAM 模板：`template.yaml`
- GitHub Actions：`.github/workflows/deploy.yml`

## 本地验证结果

以下内容已经验证通过：

- `npm install` 成功
- `npm run typecheck` 成功
- `sam validate` 成功
- `sam build` 成功
- 本地 Hono 服务已成功连接本地 PostgreSQL
- `GET /api/records` 已能从数据库返回记录
- 首页 `GET /` 已能正常返回 HTML

本地访问地址：

- `http://localhost:3000`

已验证接口现状：

- `GET /`：正常
- `GET /api/hello`：正常
- `GET /api/records`：正常

说明：

- 为了验证数据库读取链路，曾向本地 PostgreSQL 插入过一条测试记录。

## Docker PostgreSQL 本地信息

本地数据库使用 Docker 容器：

- 容器名：`homework-postgres`
- 镜像：`postgres:16`
- 端口：`5432`
- 数据库名：`appdb`
- 用户名：`postgres`
- 密码：`postgres`

当前已存在的表：

- `github_profiles`

补充说明：

- 本地 Docker PostgreSQL 默认不启用 SSL
- 代码中已调整数据库连接逻辑：本地不强制 SSL，AWS RDS 连接串带 `sslmode=require` 时自动启用 SSL

## 常用命令

安装依赖：

```bash
cd /Users/vincenthuang/web3-about/4-前端架构设计指南
npm install
```

启动本地 PostgreSQL：

```bash
docker run --name homework-postgres \
  -e POSTGRES_DB=appdb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16
```

查看 PostgreSQL 容器：

```bash
docker ps --filter name=homework-postgres
```

使用 Drizzle 推表到本地数据库：

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb \
npx drizzle-kit push --config=drizzle.config.ts --force
```

本地启动 Hono 服务：

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb \
npm run start
```

本地开发模式命令：

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb \
npm run dev
```

类型检查：

```bash
npm run typecheck
```

SAM 校验：

```bash
sam validate --region us-east-1
```

SAM 构建：

```bash
PATH="$PWD/node_modules/.bin:$PATH" \
SAM_CLI_TELEMETRY=0 \
sam build --build-dir /tmp/hono-sam-build
```

验证数据库中有哪些表：

```bash
docker exec homework-postgres psql -U postgres -d appdb -c "\dt"
```

## 当前已知约束与注意事项

- 当前页面已经从 TS 字符串中拆出，独立为 `src/views/index.html`
- 当前 `page.ts` 的职责是读取 `src/views/index.html` 并返回首页内容
- 页面中的 CSS 和 JavaScript 仍然写在 `index.html` 内部，尚未拆成独立静态资源
- 本地运行依赖 Docker Desktop 处于启动状态
- 若本地 PostgreSQL 容器已存在，再次执行 `docker run --name homework-postgres ...` 会报重名错误，此时应直接启动已有容器
- 当前本地启动命令依赖 `DATABASE_URL`
- `POST /api/github-profile` 是否成功，还需要使用真实 GitHub token 进行一次完整联调
- GitHub Actions 文件已经生成，但 AWS 侧的 IAM Role、OIDC、Secrets 还需要后续实际配置

## 下一步建议

推荐按以下顺序继续：

1. 用真实 GitHub token 测试 `POST /api/github-profile`
2. 验证页面上的新增和删除按钮完整闭环
3. 如需整理前端结构，可把 `index.html` 内联的 `style` 和 `script` 拆成独立文件
4. 继续讲解或完善 `template.yaml` 中的 VPC、子网、Lambda、RDS 配置
5. 最后再推进 AWS 实际部署与 GitHub Actions 自动部署

## 新窗口继续时可直接使用的提示词

可直接将下面这段复制到新窗口：

```text
请基于 /Users/vincenthuang/web3-about/4-前端架构设计指南 这个项目继续。

当前项目已经完成：
- Hono + Drizzle + PostgreSQL + SAM + GitHub Actions 的第一版代码骨架
- 首页已拆成 src/views/index.html
- 首页路由在 src/routes/page.ts
- 本地 Docker PostgreSQL 已跑通过，容器名为 homework-postgres
- Drizzle 已建表 github_profiles
- 本地 Hono 服务和 /api/records 已连通数据库

请先读取项目根目录的 HANDOFF.md，再继续当前任务。
```
