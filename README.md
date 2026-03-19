# Hono + SAM + RDS PostgreSQL 作业方案

## 1. 作业目标

本项目用于完成以下作业要求：

1. 使用 `Hono` 开发一个接口和一个页面，并通过 `SAM` 部署到 AWS。
2. 提供一个表单页面，通过个人 `GitHub token` 获取 GitHub 个人账户信息，并使用 `Drizzle ORM` 完成数据的新增和删除。
3. 使用 `SAM` 进行 AWS 部署，将服务和数据库放在同一个 `VPC` 中，使用 `1 个 public subnet + 2 个 private subnet`。
4. 编写 `GitHub Actions`，通过 `IAM Role` 权限自动部署项目。

## 2. 整体架构

请求链路如下：

`Browser -> API Gateway -> Lambda -> Hono -> Drizzle -> RDS PostgreSQL`

各层职责如下：

- `API Gateway`：接收外部 HTTP 请求，并触发 Lambda。
- `Lambda`：运行后端代码，是无服务器计算执行环境。
- `Hono`：编写页面路由和接口路由。
- `Drizzle ORM`：负责以 TypeScript 方式操作 PostgreSQL。
- `RDS PostgreSQL`：保存 GitHub 用户信息。

## 3. 功能设计

项目提供以下路由：

- `GET /`
  返回一个 HTML 页面，页面中包含表单和记录列表。
- `GET /api/hello`
  返回一个简单 JSON，满足“一个接口”的作业要求。
- `GET /api/records`
  查询数据库中已经保存的 GitHub 用户记录。
- `POST /api/github-profile`
  接收 GitHub token，请求 GitHub API 获取当前用户信息并写入数据库。
- `DELETE /api/records/:id`
  删除一条数据库记录。

## 4. 页面流程

页面流程如下：

1. 用户访问首页 `/`。
2. 页面展示一个输入框，用于输入 GitHub Personal Access Token。
3. 用户点击“获取并保存 GitHub 用户”按钮。
4. 前端调用 `POST /api/github-profile`。
5. 后端用 token 请求 GitHub API `/user` 获取个人资料。
6. 后端将返回的用户信息写入 PostgreSQL。
7. 页面自动刷新列表，调用 `GET /api/records` 展示数据库内容。
8. 用户点击删除按钮时，前端调用 `DELETE /api/records/:id`。

## 5. 数据库设计

本项目使用一张表：`github_profiles`

字段说明：

- `id`：数据库主键，自增。
- `github_id`：GitHub 用户真实 ID。
- `login`：GitHub 用户名。
- `name`：GitHub 显示名称，可为空。
- `avatar_url`：头像地址。
- `html_url`：GitHub 主页地址。
- `created_at`：记录创建时间。

说明：

- `github_id` 设置唯一约束，避免重复写入同一个 GitHub 用户。
- 页面展示和删除使用数据库主键 `id`。

## 6. AWS 网络设计

本项目通过 `SAM + CloudFormation` 创建如下网络资源：

- `VPC`
- `1 个 public subnet`
- `2 个 private subnet`
- `Internet Gateway`
- `NAT Gateway`
- `Route Tables`
- `Lambda Security Group`
- `RDS Security Group`

网络规划如下：

- `public subnet`
  用于放置 `NAT Gateway`，让私有子网中的 Lambda 能访问公网 GitHub API。
- `private subnet A`
  供 Lambda 使用。
- `private subnet B`
  与 private subnet A 一起组成数据库子网组，供 RDS PostgreSQL 使用。

为什么需要 NAT Gateway：

- Lambda 放在私有子网里后，默认不能直接访问公网。
- 本作业需要 Lambda 调用 GitHub API。
- 因此需要通过 `NAT Gateway` 实现私有子网出网。

## 7. 项目目录

```text
.
├─ .github/
│  └─ workflows/
│     └─ deploy.yml
├─ src/
│  ├─ app.ts
│  ├─ lambda.ts
│  ├─ lib/
│  │  └─ github.ts
│  ├─ db/
│  │  ├─ client.ts
│  │  ├─ schema.ts
│  │  └─ queries.ts
│  └─ routes/
│     ├─ api.ts
│     └─ page.ts
├─ .gitignore
├─ drizzle.config.ts
├─ package.json
├─ template.yaml
└─ tsconfig.json
```

## 8. 本地开发说明

安装依赖后，可使用以下命令：

```bash
npm install
npm run typecheck
npm run drizzle:generate
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb npm run dev
sam build
sam deploy --guided
```

说明：

- `drizzle:generate` 用于根据 schema 生成 SQL 迁移。
- 首次部署建议使用 `sam deploy --guided`，方便保存参数。
- 若本地调试 Lambda，通常还需要安装 `Docker`。

### 本地 PostgreSQL 联调

如果先在本地验证 Drizzle 与数据库操作，可使用 Docker 启动 PostgreSQL：

```bash
docker run --name homework-postgres \
  -e POSTGRES_DB=appdb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16
```

然后使用本地连接串执行 Drizzle：

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb npm run drizzle:push
```

说明：

- 本地 Docker PostgreSQL 默认不需要 SSL。
- AWS RDS 部署时，模板中的 `DATABASE_URL` 已带 `sslmode=require`。
- 之前单机版本能够直接运行的一个关键原因，是本地开发阶段已经手动执行过上面的 `drizzle:push`，所以 `github_profiles` 表和唯一索引早已存在。
- 迁移到 AWS 后，如果 `sam deploy` 或 GitHub Actions 没有额外执行数据库初始化，应用虽然能连上 RDS，但仍然会因为缺表或缺少唯一约束而报错。

## 9. GitHub Actions 部署思路

工作流使用 GitHub OIDC 获取 AWS IAM Role 临时凭证，不建议直接保存长期 AK/SK。

部署流程：

1. 拉取代码。
2. 安装 Node.js 依赖。
3. 配置 AWS 凭证。
4. 执行 `sam build`。
5. 执行 `sam deploy`。

需要预先在 GitHub 仓库中配置：

- `AWS_ROLE_ARN`
- `AWS_REGION`
- `DB_PASSWORD`

### 真实部署踩坑记录

本项目在真实 AWS 免费计划账号中已经实际踩过以下问题：

1. `sam build` 在 GitHub Actions 中报 `Cannot find esbuild`

- 解决方式：工作流中使用 `npm ci` 安装依赖，并显式执行 `npm install -g esbuild`

2. CloudFormation stack 失败后停在 `ROLLBACK_COMPLETE`

- 解决方式：部署前先删除坏栈，再重新部署
- 当前工作流已加入这一检查逻辑

3. RDS 备份天数不兼容当前账号计划

- 错误现象：`The specified backup retention period exceeds the maximum available to free tier customers`
- 原因：`template.yaml` 中 `BackupRetentionPeriod: 7` 过高
- 建议：改为 `1`

4. RDS 实例规格不兼容当前账号计划

- 错误现象：`This instance size isn't available with free plan accounts`
- 已确认：`db.t4g.micro` 在当前账号失败
- 建议：优先尝试 `db.t3.micro`

5. RDS 主密码不符合字符规则

- 错误现象：`MasterUserPassword is not a valid password`
- 不应包含的字符：`/`、`@`、`"`、空格
- 建议先使用仅包含字母和数字的密码

说明：

- 当前作业要求是将 Lambda、RDS 和网络资源放在同一个 `VPC` 中，不是部署到某台 `EC2`
- 因此 EC2 是否开机，不会直接决定这套 `SAM + Lambda + RDS` 架构能否成功部署

## 10. 答辩可用总结

本作业采用 `Hono + AWS Lambda + API Gateway + RDS PostgreSQL + Drizzle ORM + SAM + GitHub Actions` 的技术组合，实现了一个可部署的 serverless 全栈应用。系统通过表单获取 GitHub 用户信息，并将数据写入 PostgreSQL，同时提供新增、查询和删除能力。部署层面使用 SAM 管理应用与网络资源，并将 Lambda 和数据库放入同一个 VPC，通过 GitHub Actions 配合 IAM Role 完成自动化部署。
