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

补充背景记录：

- 之前单机版本之所以数据库表已经存在，是因为开发过程中手动执行过 Drizzle 推表命令
- 当时使用过的命令是：

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb npm run drizzle:push
```

- 这一步会把 `src/db/schema.ts` 中定义的表结构直接推到本地 PostgreSQL
- 因此单机版本运行时看起来像是“应用启动后自动可用”，但本质上是因为数据库已经被预先初始化
- 迁移到 AWS Lambda + RDS 后，如果部署流程里没有显式执行 migration / push，就会出现数据库存在但表不存在，或者表缺少唯一索引的情况

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
- GitHub Actions 所需的 OIDC、IAM Role、Secrets 已实际配置过，并已验证工作流可以拿到 AWS 临时凭证

## GitHub Actions / AWS 实际排障记录

以下问题均为本项目在真实 AWS 账号中实际遇到的问题，后续继续部署时应优先参考：

1. `sam build` 在 GitHub Actions 中找不到 `esbuild`

- 现象：工作流在 `Build` 阶段失败，报错 `Cannot find esbuild`
- 处理：`.github/workflows/deploy.yml` 已改为先执行 `npm ci`，再执行 `npm install -g esbuild`
- 结论：这不是 AWS 权限问题，而是 CI 构建环境中 `SAM CLI` 没找到 `esbuild` 可执行文件

2. CloudFormation stack 卡在 `ROLLBACK_COMPLETE`

- 现象：`sam deploy` 后 stack 失败并停留在 `ROLLBACK_COMPLETE`
- 处理：工作流已加入自动检查；若 `hono-sam-homework` 处于 `ROLLBACK_COMPLETE`，会先执行删除，再重新部署
- 手动删除命令：

```bash
aws cloudformation delete-stack \
  --stack-name hono-sam-homework \
  --profile codex-mcp \
  --region us-east-2
```

3. RDS 备份天数不兼容当前免费计划

- 现象：CloudFormation 报错 `The specified backup retention period exceeds the maximum available to free tier customers`
- 根因：`template.yaml` 中 `BackupRetentionPeriod: 7` 对当前账号计划不兼容
- 建议：优先尝试改为 `1`

4. RDS 实例规格不兼容当前免费计划

- 现象：CloudFormation 报错 `This instance size isn't available with free plan accounts`
- 根因：`template.yaml` 中的 `DBInstanceClass` 当前配置对免费计划不兼容
- 已验证：`db.t4g.micro` 在当前账号计划下会失败
- 建议：优先尝试 `db.t3.micro`

5. RDS 主密码格式不合法

- 现象：CloudFormation 报错 `MasterUserPassword is not a valid password`
- 根因：GitHub Secret `DB_PASSWORD` 中使用了 RDS 不接受的字符
- RDS 明确不接受的字符包括：`/`、`@`、`"`、空格
- 建议密码示例：`Postgres123456` 或 `HomeworkDb2026`

6. 当前作业的网络目标是 `VPC`，不是 `EC2`

- 说明：作业要求是“服务和数据库放在同一个 `VPC` 中”，不是“都安装在某台 `EC2` 里”
- 因此当前已停止的 EC2 `i-02625ca93f0975169` 不会直接影响这套 `SAM + Lambda + RDS` 部署流程
- 当前这台 EC2 仅用于其他 AWS 操作排查时参考，不属于本作业主部署链路

## 下一步建议

推荐按以下顺序继续：

1. 用真实 GitHub token 测试 `POST /api/github-profile`
2. 验证页面上的新增和删除按钮完整闭环
3. 如需整理前端结构，可把 `index.html` 内联的 `style` 和 `script` 拆成独立文件
4. 继续讲解或完善 `template.yaml` 中的 VPC、子网、Lambda、RDS 配置
5. 将 `template.yaml` 中 RDS 配置调整为适配当前免费计划后，再次执行部署
6. 最后再推进 AWS 实际部署与 GitHub Actions 自动部署

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
- GitHub Actions 的 OIDC / IAM Role / Secrets 已完成首轮打通
- AWS 实际部署时，已确认当前账号会受 RDS 备份天数、实例规格、密码字符规则限制

请先读取项目根目录的 HANDOFF.md，再继续当前任务。
```
