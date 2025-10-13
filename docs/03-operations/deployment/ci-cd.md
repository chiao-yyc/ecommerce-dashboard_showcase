# GitHub Actions CI/CD Pipeline

| Job  | 觸發 | 內容                               |
|------|------|------------------------------------|
| **build-test** | PR / main | pnpm install ➜ Lint ➜ Vitest |
| **docker-push**| main     | Build image ➜ Push ECR      |
| **deploy**     | main     | 更新 ECS Service (Fargate)  |

---

## `.github/workflows/main.yml`

```yaml
name: CI/CD

on:
  push:
    branches: [ main ]
  pull_request:

env:
  REGISTRY: <acct>.dkr.ecr.ap-northeast-1.amazonaws.com
  IMAGE_NAME: growth-dashboard

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 8 }
      - run: pnpm install
      - run: pnpm run lint
      - run: pnpm run test

  docker-push:
    needs: build-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE }}
          aws-region: ap-northeast-1
      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2
      - name: Build & push
        run: |
          TAG=${{ github.sha }}
          docker build -t $REGISTRY/$IMAGE_NAME:$TAG .
          docker push $REGISTRY/$IMAGE_NAME:$TAG
      - name: Set image tag output
        id: vars
        run: echo "tag=${{ github.sha }}" >> "$GITHUB_OUTPUT"

  deploy:
    needs: docker-push
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE }}
          aws-region: ap-northeast-1
      - name: Update ECS Service
        run: |
          aws ecs update-service \
            --cluster growth-cluster \
            --service dashboard-service \
            --force-new-deployment
```

---

## 資安 & 最佳實踐

- 機密值存於 **GitHub Encrypted Secrets** (`AWS_ROLE`, `SUPABASE_URL`)  
- Tag 使用 `github.sha`，確保可追溯  
- PR job 阶段阻擋未通過 lint / test 的程式碼  
- 可加 `trivy` 或 `grype` Container Scanning

---

完成以上設定後，**Push→自動測試→建置→部署** 即全線打通。  
若你改用 GCP Cloud Run 或 Azure Web App，只需替換登入／部署步驟即可。
```
