# Docker 使用教程

> 本教程将帮助你快速上手 Docker，包括镜像、容器、网络、数据卷和 Compose 的基本概念与常用命令，并提供速查表。

---

## 目录

1. [Docker 是什么](#docker-是什么)
2. [安装](#安装)
3. [核心概念](#核心概念)
4. [镜像管理](#镜像管理)
5. [容器管理](#容器管理)
6. [数据卷与网络](#数据卷与网络)
7. [使用 Dockerfile 构建镜像](#使用-dockerfile-构建镜像)
8. [Docker Compose](#docker-compose)
9. [系统清理与调试](#系统清理与调试)
10. [Cheat Sheet 速查表](#cheat-sheet-速查表)

---

## Docker 是什么

Docker 是一个开源的应用容器引擎，利用 Linux 容器 (LXC) 技术实现进程级虚拟化，提供一致的运行环境，使 "一次构建，到处运行" 成为可能。

---

## 安装

### Linux (Ubuntu 示例)
```bash
# 使用官方脚本
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
# 或使用 apt
sudo apt update && sudo apt install docker-ce docker-ce-cli containerd.io -y
# 加入 docker 组（免 sudo）
sudo usermod -aG docker $USER
```
> 修改用户组后请重新登录。

### macOS & Windows
- 推荐安装 **Docker Desktop**：<https://www.docker.com/products/docker-desktop>

---

## 核心概念

| 概念 | 描述 |
| ---- | ---- |
| 镜像 (Image) | 应用及其依赖的只读模板。 |
| 容器 (Container) | 镜像的运行实例，包含可写层。 |
| 仓库 (Registry) | 存储镜像的服务器，如 Docker Hub、Harbor。 |
| 数据卷 (Volume) | 持久化或共享数据的机制。 |
| 网络 (Network) | 容器之间或与主机通信的虚拟网络。 |

---

## 镜像管理

```bash
# 搜索镜像
docker search nginx
# 拉取镜像
docker pull nginx:latest
# 列出镜像
docker images [-a]
# 删除镜像
docker rmi nginx:latest
# 给镜像打标签
docker tag nginx:latest myrepo/nginx:1.0
# 推送到仓库
docker push myrepo/nginx:1.0
```

---

## 容器管理

```bash
# 运行容器
docker run --name web -d -p 80:80 nginx:latest
# 交互式运行
docker run -it --rm ubuntu bash
# 查看运行中的容器
docker ps [-a]
# 停止/启动/重启容器
docker stop web
docker start web
docker restart web
# 进入正在运行的容器
docker exec -it web /bin/bash
# 查看容器日志
docker logs -f web
# 删除容器
docker rm web
```

---

## 数据卷与网络

### 卷 (Volumes)
```bash
# 创建卷
docker volume create mydata
# 在容器中挂载卷
docker run -d -v mydata:/var/lib/mysql mysql:8
# 列出卷
docker volume ls
# 删除卷
docker volume rm mydata
```

### 绑定挂载
```bash
# 将主机目录挂载到容器
docker run -v $(pwd)/logs:/app/logs app:latest
```

### 网络 (Networks)
```bash
# 创建网络
docker network create mynet
# 通过网络启动容器
docker run -d --name db --network mynet mysql:8
# 将已有容器加入网络
docker network connect mynet web
# 查看网络
docker network ls
# 删除网络
docker network rm mynet
```

---

## 使用 Dockerfile 构建镜像

Dockerfile 示例：
```Dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
COPY . .
CMD ["python", "main.py"]
```
构建命令：
```bash
docker build -t myapp:1.0 .
```

---

## Docker Compose

Compose 使用 `docker-compose.yml` 定义多容器应用：
```yaml
version: "3.9"
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: example
    volumes:
      - db-data:/var/lib/mysql
  web:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - db
volumes:
  db-data:
```

```bash
docker compose up -d      # 启动
docker compose logs -f    # 查看日志
docker compose down       # 停止并删除容器/网络
```

---

## 系统清理与调试

```bash
# 查看磁盘使用
docker system df
# 清理无用对象（镜像、容器、卷、网络）
docker system prune -af --volumes
# 查看详细信息
docker inspect <container|image|volume>
# 容器资源使用统计
docker stats
```

---

## Cheat Sheet 速查表

| 场景 | 命令 |
| ---- | ---- |
| 查看版本 | `docker --version` |
| 登录仓库 | `docker login` |
| 搜索镜像 | `docker search nginx` |
| 拉取镜像 | `docker pull nginx:latest` |
| 列出镜像 | `docker images` |
| 删除镜像 | `docker rmi <image>` |
| 构建镜像 | `docker build -t repo/app:tag .` |
| 打标签 | `docker tag <image> repo/app:tag` |
| 推送镜像 | `docker push repo/app:tag` |
| 运行容器 (后台) | `docker run -d --name app repo/app:tag` |
| 运行容器 (交互)| `docker run -it --rm ubuntu bash` |
| 查看容器 | `docker ps [-a]` |
| 查看日志 | `docker logs [-f] <container>` |
| 进入容器 | `docker exec -it <container> bash` |
| 停止容器 | `docker stop <container>` |
| 删除容器 | `docker rm <container>` |
| 创建卷 | `docker volume create data` |
| 挂载卷 | `docker run -v data:/path app` |
| 创建网络 | `docker network create net` |
| Compose 启动 | `docker compose up -d` |
| Compose 停止 | `docker compose down` |
| 清理系统 | `docker system prune -af --volumes` |

> 🔗 进一步阅读：官方文档 <https://docs.docker.com/> 