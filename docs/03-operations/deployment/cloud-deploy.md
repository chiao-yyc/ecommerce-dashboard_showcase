# Cloud Deploy 🚀 (AWS ECS Fargate)

> 快速將容器映像推至 AWS Elastic Container Registry，再由 ECS Fargate 無伺服器執行

---

## 前置條件

- AWS CLI 已登入 (`aws configure`)  
- 已建立 **ECR repository**：`growth-dashboard`  
- 已建立 **ECS Cluster** 與 **Fargate Task 定義 (1 vCPU / 1 GB)**

---

## 步驟

### 1. Build & Push Image

```bash
# 登入 ECR
aws ecr get-login-password --region ap-northeast-1 \
  | docker login --username AWS --password-stdin <acct>.dkr.ecr.ap-northeast-1.amazonaws.com

# 以 Git SHA 作為 tag
TAG=$(git rev-parse --short HEAD)

# 建置
docker build -t growth-dashboard:$TAG .

# Tag & Push
docker tag growth-dashboard:$TAG \
  <acct>.dkr.ecr.ap-northeast-1.amazonaws.com/growth-dashboard:$TAG
docker push <acct>.dkr.ecr.ap-northeast-1.amazonaws.com/growth-dashboard:$TAG
```

### 2. 更新 ECS Task 定義

```bash
aws ecs update-service \
  --cluster growth-cluster \
  --service dashboard-service \
  --force-new-deployment
```

ECS 會自動拉取最新 Tag 並以滾動方式替換舊版 Task。

---

## 進階：自動藍綠 (CodeDeploy)

1. 建立 **CodeDeploy Application** 與 **Deployment Group**  
2. 在 GitHub Actions 中加入 `aws deploy create-deployment ...`  
3. 使用健康檢查 (ALB Target Group) 決定切換流量

---

## 監控

- **CloudWatch Logs**：`/ecs/dashboard-service`  
- **AWS X‑Ray**（可選）追蹤 API 延遲  
- **Alarm**：CPU > 80 % or 5xx > 1 % → SNS
