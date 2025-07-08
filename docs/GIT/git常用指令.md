# Git 使用教程

> 本教程面向 Git 新手，也可作为日常查阅的速查表。包含 Git 的安装、基本概念、常用命令与高阶用法，并提供常见操作示例。

---

## 目录

1. [Git 是什么](#git-是什么)
2. [安装](#安装)
3. [基础配置](#基础配置)
4. [创建与克隆仓库](#创建与克隆仓库)
5. [工作区 & 暂存区](#工作区--暂存区)
6. [常用命令](#常用命令)
7. [分支管理](#分支管理)
8. [远程仓库](#远程仓库)
9. [标签 (Tag)](#标签-tag)
10. [回滚与恢复](#回滚与恢复)
11. [忽略文件](#忽略文件)
12. [常见场景示例](#常见场景示例)
13. [Cheat Sheet 速查表](#cheat-sheet-速查表)

---

## Git 是什么

Git 是一款分布式版本控制系统，用于跟踪文件内容的变化、多人协作开发及版本管理。其核心特性包括：

- **分布式**：每个开发者本地都拥有完整仓库副本，可离线操作。
- **快速**：多采用本地计算，提交、分支切换性能优秀。
- **数据完整性**：所有对象通过 SHA-1 哈希校验，保证文件不可篡改。

---

## 安装

### Linux (apt)
```bash
sudo apt update && sudo apt install git -y
```

### macOS (brew)
```bash
brew install git
```

### Windows
- 官方安装包：<https://git-scm.com/download/win>
- 安装完成后可使用 **Git Bash** 终端。

---

## 基础配置

```bash
git config --global user.name  "Your Name"
git config --global user.email "your.email@example.com"
# 默认推送分支策略
git config --global push.default simple
# 显示彩色输出
git config --global color.ui auto
```
配置文件位于 `~/.gitconfig`。

---

## 创建与克隆仓库

```bash
# 在当前目录初始化仓库
git init
# 克隆远程仓库
git clone https://github.com/user/repo.git
```

---

## 工作区 & 暂存区

- **工作区 (Working Directory)**：当前项目文件夹。
- **暂存区 (Staging Area / Index)**：记录将要提交的快照。
- **本地仓库 (Repository)**：保存所有提交对象 (.git)。

工作流程：编辑 → `git add` → `git commit` → `git push`。

---

## 常用命令

```bash
# 查看状态
git status
# 查看差异
git diff            # 工作区 vs 暂存区
git diff --cached   # 暂存区 vs 最近一次提交
# 添加到暂存区
git add <file|dir>  # 支持通配符
git add -u          # 仅跟踪已存在文件的变更
# 提交
git commit -m "feat: add login api"
# 修改最近一次提交信息
git commit --amend -m "fix: correct login api bug"
```

---

## 分支管理

```bash
# 创建并切换分支
git checkout -b feature/login   # 老写法
git switch -c feature/login     # 新写法
# 查看所有分支
git branch -a
# 合并分支到当前分支
git merge feature/login
# 删除分支
git branch -d feature/login
```

> 建议使用 [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/) 或 trunk-based workflow。

---

## 远程仓库

```bash
# 查看远程
git remote -v
# 添加远程
git remote add origin git@github.com:user/repo.git
# 推送
git push -u origin main  # 首次推送绑定 upstream
git push                 # 之后直接 push
# 拉取并自动合并
git pull
# 仅获取不合并
git fetch
```

---

## 标签 (Tag)

```bash
# 创建轻量标签
git tag v1.0.0
# 创建带注释标签
git tag -a v1.0.0 -m "Release 1.0.0"
# 推送单个标签
git push origin v1.0.0
# 推送所有标签
git push origin --tags
```

---

## 回滚与恢复

```bash
# 查看提交历史 （单行）
git log --oneline --graph --decorate --all
# 重置到指定提交（危险，慎用！）
git reset --hard <commit>
# 创建新提交撤销修改（安全）
git revert <commit>
# 临时保存工作现场
git stash [push -m "msg"]
git stash list
git stash pop
# 查看引用日志（找回误删提交）
git reflog
```

---

## 忽略文件
在仓库根目录创建 `.gitignore`：
```gitignore
# 编译输出
build/
*.o
# IDE
.vscode/
.idea/
```
GitHub 提供[官方模板](https://github.com/github/gitignore)。

---

## 常见场景示例

### 1. 合并远程更新并解决冲突
```bash
git pull origin main
# 编辑冲突文件，手动保留正确代码
git add <file>
git commit -m "fix: resolve merge conflict"
```

### 2. 用交互式变基整理提交历史
```bash
git fetch origin
# 把当前分支的提交压缩为1个提交
git rebase -i origin/main
```

### 3. 二分查找 bug
```bash
git bisect start
git bisect bad                 # 当前提交有 bug
git bisect good <commit_hash>  # 早期正常的提交
# Git 会自动 checkout 中间提交，测试后标记 good/bad 直到找出有问题的提交
```

---

## Cheat Sheet 速查表

| 操作 | 命令 |
| ---- | ---- |
| 查看版本 | `git --version` |
| 初始化仓库 | `git init` |
| 克隆仓库 | `git clone <url>` |
| 查看状态 | `git status` |
| 比较差异 | `git diff [--cached]` |
| 添加到暂存区 | `git add <file>` |
| 提交 | `git commit -m "msg"` |
| 查看提交历史 | `git log --oneline --graph --decorate --all` |
| 创建分支 | `git branch <name>` / `git switch -c <name>` |
| 切换分支 | `git checkout <name>` / `git switch <name>` |
| 删除分支 | `git branch -d <name>` |
| 合并 | `git merge <branch>` |
| 变基 | `git rebase <branch>` |
| 推送 | `git push [origin] [branch]` |
| 拉取 | `git pull` |
| 获取 | `git fetch` |
| 标签 | `git tag [-a] <tag>` |
| 临时保存 | `git stash` |
| 查看 reflog | `git reflog` |
| 撤销提交 | `git revert <commit>` |
| 强制回退 | `git reset --hard <commit>` |

> ✅ 建议配合 [Git 官方文档](https://git-scm.com/doc) 与图形化工具（如 **GitKraken**, **SourceTree**, **GitHub Desktop**）一同使用。 