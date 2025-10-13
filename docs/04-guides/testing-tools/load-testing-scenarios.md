# 負載測試場景設計

## 概述

本文檔詳細定義了電商平台的關鍵負載測試場景，涵蓋客戶購物流程、管理員操作、即時通知系統和 JSONB 快照效能等核心業務場景。每個場景都包含具體的測試腳本、預期指標和故障排除方法。

## 測試場景分類

### **高頻場景** (80% 流量)
- 客戶瀏覽商品
- 加入購物車
- 客服即時對話

### **中頻場景** (15% 流量)  
- 客戶註冊登入
- 訂單建立結帳
- 管理員訂單處理

### **低頻場景** (5% 流量)
- 庫存大量更新
- 系統報告生成
- 權限角色管理

## 🛒 場景 1: 客戶完整購物旅程

### 場景描述
模擬真實客戶從註冊到完成購買的完整流程，測試前後台系統的協調性和 JSONB 快照生成效能。

### 負載參數
```yaml
# artillery-customer-journey.yml
config:
  target: 'http://localhost:5173'  # front-stage-vue
  phases:
    - duration: 300  # 5分鐘爬升期
      arrivalRate: 1
      rampTo: 20
    - duration: 900  # 15分鐘穩定期  
      arrivalRate: 20
    - duration: 300  # 5分鐘降低期
      arrivalRate: 20
      rampTo: 1
  processor: './customer-journey-functions.js'
  
variables:
  categories: ['electronics', 'clothing', 'home', 'books']
  paymentMethods: ['credit_card', 'paypal', 'bank_transfer']
  
scenarios:
  - name: "完整購物旅程"
    weight: 100
    flow:
      # 1. 首頁瀏覽
      - get:
          url: "/"
          capture:
            - regex: 'sessionId":"([^"]*)"'
              as: sessionId
      
      # 2. 客戶註冊
      - function: "generateCustomerData"
      - post:
          url: "/api/auth/register"
          json:
            name: "{{ customerName }}"
            email: "{{ customerEmail }}"
            password: "CustomerPass123!"
            preferences:
              newsletter: true
              category: "{{ $randomString(categories) }}"
          capture:
            - json: "$.user.id"
              as: customerId
            - json: "$.access_token" 
              as: accessToken
          expect:
            - statusCode: 201
      
      # 3. 瀏覽商品分類 
      - think: 2
      - get:
          url: "/api/products"
          qs:
            category: "{{ $randomString(categories) }}"
            page: 1
            limit: 20
          headers:
            Authorization: "Bearer {{ accessToken }}"
      
      # 4. 查看商品詳細頁
      - function: "selectRandomProduct"
      - think: 5
      - get:
          url: "/api/products/{{ productId }}"
          headers:
            Authorization: "Bearer {{ accessToken }}"
          capture:
            - json: "$.price"
              as: productPrice
            - json: "$.inventory.quantity"
              as: availableStock
      
      # 5. 加入購物車
      - think: 3
      - post:
          url: "/api/cart/add"
          headers:
            Authorization: "Bearer {{ accessToken }}"
          json:
            product_id: "{{ productId }}"
            quantity: "{{ $randomInt(1, 3) }}"
          expect:
            - statusCode: 200
      
      # 6. 檢視購物車
      - think: 2
      - get:
          url: "/api/cart"
          headers:
            Authorization: "Bearer {{ accessToken }}"
          capture:
            - json: "$.total_amount"
              as: cartTotal
      
      # 7. 結帳流程
      - think: 10  # 用戶考慮時間
      - post:
          url: "/api/orders/create"
          headers:
            Authorization: "Bearer {{ accessToken }}"
          json:
            payment_method: "{{ $randomString(paymentMethods) }}"
            shipping_address:
              street: "{{ $randomString(['123 Main St', '456 Oak Ave', '789 Pine Rd']) }}"
              city: "{{ $randomString(['Taipei', 'Kaohsiung', 'Taichung']) }}"
              postal_code: "{{ $randomInt(10000, 99999) }}"
            special_instructions: "測試訂單 - {{ sessionId }}"
          capture:
            - json: "$.order.id"
              as: orderId
            - json: "$.order.order_number"
              as: orderNumber
          expect:
            - statusCode: 201
      
      # 8. 確認訂單建立 (驗證 JSONB 快照)
      - think: 1
      - get:
          url: "/api/orders/{{ orderId }}"
          headers:
            Authorization: "Bearer {{ accessToken }}"
          expect:
            - statusCode: 200
            - json: "$.jsonb_snapshots.product_snapshot"
            - json: "$.jsonb_snapshots.pricing_snapshot"
      
      # 9. 客服諮詢 (30% 機率)
      - function: "shouldContactSupport"  # 返回 true 30% 機率
      - ifTrue:
          - post:
              url: "/api/conversations"
              headers:
                Authorization: "Bearer {{ accessToken }}"
              json:
                subject: "訂單相關問題 - {{ orderNumber }}"
                message: "請問我的訂單什麼時候會出貨？"
                order_id: "{{ orderId }}"
              capture:
                - json: "$.conversation.id"
                  as: conversationId
```

### 自定義函數
```javascript
// customer-journey-functions.js
const faker = require('@faker-js/faker')

module.exports = {
  generateCustomerData,
  selectRandomProduct,
  shouldContactSupport
}

function generateCustomerData(context, events, done) {
  context.vars.customerName = faker.name.fullName()
  context.vars.customerEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@loadtest.com`
  return done()
}

function selectRandomProduct(context, events, done) {
  // 從前一個產品 API 回應中選擇產品
  const products = context.vars.$response?.data || []
  if (products.length > 0) {
    const randomProduct = products[Math.floor(Math.random() * products.length)]
    context.vars.productId = randomProduct.id
  } else {
    // 備用產品 ID
    context.vars.productId = Math.floor(Math.random() * 50) + 1
  }
  return done()
}

function shouldContactSupport(context, events, done) {
  context.vars.shouldContactSupport = Math.random() < 0.3
  return done()
}
```

### 預期效能指標
- **註冊 API**: < 2 秒
- **商品查詢**: < 800ms  
- **購物車操作**: < 500ms
- **訂單建立**: < 3 秒 (包含 JSONB 快照生成)
- **整體旅程**: < 20 秒

## 👨‍💼 場景 2: 管理員高頻操作

### 場景描述
模擬管理員在後台系統進行訂單處理、庫存管理、客服回覆等高頻操作，測試後台系統在高負載下的穩定性。

### 測試腳本
```yaml
# artillery-admin-operations.yml
config:
  target: 'http://localhost:5174'  # admin-platform-vue
  phases:
    - duration: 120
      arrivalRate: 5
    - duration: 600
      arrivalRate: 15
    - duration: 120  
      arrivalRate: 5
  processor: './admin-operations-functions.js'

scenarios:
  - name: "管理員登入"
    weight: 5
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "admin@example.com"
            password: "AdminPass123!"
          capture:
            - json: "$.access_token"
              as: adminToken
            - json: "$.user.id"
              as: adminId

  - name: "訂單處理作業"
    weight: 40
    flow:
      - function: "authenticateAdmin"
      
      # 查看待處理訂單
      - get:
          url: "/api/admin/orders"
          headers:
            Authorization: "Bearer {{ adminToken }}"
          qs:
            status: "pending"
            limit: 50
          capture:
            - json: "$.data[0].id"
              as: orderId
      
      # 查看訂單詳細
      - get:
          url: "/api/admin/orders/{{ orderId }}"
          headers:
            Authorization: "Bearer {{ adminToken }}"
          expect:
            - statusCode: 200
            - json: "$.jsonb_snapshots"  # 驗證快照完整性
      
      # 更新訂單狀態
      - patch:
          url: "/api/admin/orders/{{ orderId }}/status"
          headers:
            Authorization: "Bearer {{ adminToken }}"
          json:
            status: "processing"
            notes: "訂單已確認，開始處理"
          expect:
            - statusCode: 200

  - name: "庫存管理操作"  
    weight: 25
    flow:
      - function: "authenticateAdmin"
      
      # 檢視低庫存商品
      - get:
          url: "/api/admin/inventory/low-stock"
          headers:
            Authorization: "Bearer {{ adminToken }}"
          capture:
            - json: "$.data[0].product_id"
              as: lowStockProductId
      
      # 補充庫存
      - post:
          url: "/api/admin/inventory/restock"
          headers:
            Authorization: "Bearer {{ adminToken }}"
          json:
            product_id: "{{ lowStockProductId }}"
            quantity: "{{ $randomInt(50, 200) }}"
            reason: "負載測試補貨"
          expect:
            - statusCode: 200

  - name: "客服回覆處理"
    weight: 30
    flow:
      - function: "authenticateAdmin"
      
      # 獲取待處理對話
      - get:
          url: "/api/admin/conversations/pending"
          headers:
            Authorization: "Bearer {{ adminToken }}"
          capture:
            - json: "$.data[0].id"
              as: conversationId
      
      # 客服回覆
      - post:
          url: "/api/admin/conversations/{{ conversationId }}/reply"
          headers:
            Authorization: "Bearer {{ adminToken }}"
          json:
            message: "感謝您的諮詢，我們會儘快為您處理。"
            is_internal: false
            agent_id: "{{ adminId }}"
          expect:
            - statusCode: 201
      
      # 標記對話為已處理
      - patch:
          url: "/api/admin/conversations/{{ conversationId }}"
          headers:
            Authorization: "Bearer {{ adminToken }}"
          json:
            status: "resolved"
```

### 預期效能指標
- **登入驗證**: < 1 秒
- **訂單查詢**: < 1.5 秒
- **庫存更新**: < 800ms
- **客服回覆**: < 1 秒

## 場景 3: 即時通知系統壓力測試

### 場景描述
測試 WebSocket 連接在高並發情況下的穩定性，以及即時通知系統的延遲表現。

### WebSocket 負載測試
```javascript
// k6-websocket-load.js
import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  vus: 50,        // 50個並發用戶
  duration: '10m', // 測試10分鐘
};

export default function () {
  const url = 'ws://localhost:5174/ws';
  const params = {
    headers: {
      'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'  // 測試用 token
    }
  };

  const res = ws.connect(url, params, function (socket) {
    let notificationCount = 0;
    let totalLatency = 0;

    socket.on('open', () => {
      console.log('WebSocket 連接建立');
      
      // 訂閱通知頻道
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: 'notifications',
        userId: `test-user-${__VU}`
      }));
    });

    socket.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'notification') {
        notificationCount++;
        
        // 計算延遲 (如果訊息包含時間戳)
        if (message.timestamp) {
          const latency = Date.now() - message.timestamp;
          totalLatency += latency;
        }
      }
    });

    socket.on('close', () => {
      const avgLatency = notificationCount > 0 ? totalLatency / notificationCount : 0;
      
      check(null, {
        '收到通知數量 > 0': () => notificationCount > 0,
        '平均延遲 < 2000ms': () => avgLatency < 2000,
      });
    });

    // 保持連接並定期發送心跳
    socket.setTimeout(() => {
      socket.ping();
    }, 30000);

    // 模擬用戶活動觸發通知
    setTimeout(() => {
      socket.send(JSON.stringify({
        type: 'activity',
        action: 'view_product',
        productId: Math.floor(Math.random() * 100) + 1
      }));
    }, 5000);
  });

  check(res, { 'WebSocket 連接成功': (r) => r && r.status === 101 });
}
```

### 預期效能指標
- **WebSocket 連接建立**: < 100ms
- **通知延遲**: < 2 秒
- **連接穩定性**: 99.5% uptime
- **並發連接數**: 支援 200+ 同時連接

## 場景 4: JSONB 快照系統效能

### 場景描述
專門測試 JSONB 快照系統在大量訂單建立時的效能表現，確保資料完整性不影響系統回應速度。

### 資料庫壓力測試
```sql
-- performance-tests/jsonb-snapshot-load.sql

-- 建立測試用的大量訂單函數
CREATE OR REPLACE FUNCTION load_test_create_bulk_orders(
  batch_size INTEGER DEFAULT 100,
  customer_count INTEGER DEFAULT 50
) RETURNS jsonb AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  avg_response_time NUMERIC;
  snapshot_check_result JSONB;
  order_record RECORD;
  i INTEGER;
BEGIN
  start_time := clock_timestamp();
  
  -- 批次建立訂單
  FOR i IN 1..batch_size LOOP
    INSERT INTO orders (
      customer_id,
      order_number,
      total_amount,
      status,
      created_at
    )
    SELECT 
      (RANDOM() * customer_count)::INTEGER + 1,
      'LOAD-TEST-' || LPAD(i::TEXT, 6, '0'),
      (RANDOM() * 1000 + 50)::NUMERIC(10,2),
      'pending',
      NOW()
    FROM generate_series(1, 1);
  END LOOP;
  
  end_time := clock_timestamp();
  avg_response_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000 / batch_size;
  
  -- 驗證 JSONB 快照完整性
  SELECT jsonb_build_object(
    'total_orders', COUNT(*),
    'orders_with_snapshots', COUNT(*) FILTER (WHERE jsonb_snapshots IS NOT NULL),
    'snapshot_completeness_rate', 
      ROUND(
        (COUNT(*) FILTER (WHERE jsonb_snapshots IS NOT NULL)::NUMERIC / COUNT(*)) * 100, 
        2
      )
  ) INTO snapshot_check_result
  FROM orders 
  WHERE order_number LIKE 'LOAD-TEST-%';
  
  RETURN jsonb_build_object(
    'batch_size', batch_size,
    'avg_response_time_ms', avg_response_time,
    'snapshot_integrity', snapshot_check_result,
    'performance_grade', 
      CASE 
        WHEN avg_response_time < 100 THEN 'A'
        WHEN avg_response_time < 500 THEN 'B' 
        WHEN avg_response_time < 1000 THEN 'C'
        ELSE 'D'
      END
  );
END;
$$ LANGUAGE plpgsql;

-- 執行壓力測試
SELECT load_test_create_bulk_orders(500, 100);

-- 清理測試資料
DELETE FROM orders WHERE order_number LIKE 'LOAD-TEST-%';
```

### k6 資料庫連接測試
```javascript
// k6-database-load.js
import sql from 'k6/x/sql';
import { check } from 'k6';

export const options = {
  vus: 20,
  duration: '5m',
};

const db = sql.open('postgres', 'postgresql://postgres:postgres@localhost:54322/postgres');

export default function () {
  // 測試大量 JSONB 查詢
  const result = sql.query(db, `
    SELECT 
      id,
      jsonb_snapshots->'product_snapshot' as products,
      jsonb_snapshots->'pricing_snapshot' as pricing,
      extract(epoch from (now() - created_at)) * 1000 as age_ms
    FROM orders 
    WHERE created_at > now() - interval '1 hour'
    AND jsonb_snapshots IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 50
  `);

  check(result, {
    'JSONB 查詢成功': (r) => r.length >= 0,
    'JSONB 查詢速度 < 500ms': (r) => {
      // 簡單的延遲檢查
      const start = Date.now();
      JSON.parse(JSON.stringify(r));
      return (Date.now() - start) < 500;
    }
  });
}

export function teardown() {
  db.close();
}
```

### 預期效能指標
- **單一訂單建立**: < 200ms
- **批次訂單建立**: < 100ms/筆 平均
- **JSONB 快照完整性**: 100%
- **複雜 JSONB 查詢**: < 500ms

## 場景 5: 綜合壓力測試

### 場景描述
結合所有場景的混合負載測試，模擬真實的生產環境流量分佈。

### 混合場景配置
```yaml
# artillery-mixed-load.yml
config:
  target: 'http://localhost:5174'
  phases:
    - duration: 600   # 10分鐘
      arrivalRate: 10
      name: "爬升階段"
    - duration: 1800  # 30分鐘
      arrivalRate: 50  
      name: "穩定負載階段"
    - duration: 600   # 10分鐘  
      arrivalRate: 10
      name: "降低階段"

scenarios:
  # 高頻場景 - 80% 流量
  - name: "商品瀏覽"
    weight: 50
    flow:
      - get:
          url: "/api/products"
          qs:
            page: "{{ $randomInt(1, 20) }}"

  - name: "購物車操作"
    weight: 20
    flow:
      - function: "simulateAuthentication"
      - post:
          url: "/api/cart/add"
          headers:
            Authorization: "Bearer {{ userToken }}"
          json:
            product_id: "{{ $randomInt(1, 100) }}"
            quantity: "{{ $randomInt(1, 3) }}"

  - name: "即時客服"
    weight: 10
    flow:
      - function: "simulateAuthentication"
      - post:
          url: "/api/conversations"
          headers:
            Authorization: "Bearer {{ userToken }}"
          json:
            message: "我想詢問產品相關問題"

  # 中頻場景 - 15% 流量  
  - name: "客戶註冊"
    weight: 8
    flow:
      - function: "generateCustomerData"
      - post:
          url: "/api/auth/register"
          json:
            name: "{{ customerName }}"
            email: "{{ customerEmail }}" 
            password: "TestPass123!"

  - name: "訂單建立"
    weight: 5
    flow:
      - function: "simulateAuthentication" 
      - post:
          url: "/api/orders/create"
          headers:
            Authorization: "Bearer {{ userToken }}"
          json:
            items: [
              {
                product_id: "{{ $randomInt(1, 100) }}",
                quantity: "{{ $randomInt(1, 2) }}"
              }
            ]

  - name: "管理員操作"
    weight: 2
    flow:
      - function: "authenticateAdmin"
      - get:
          url: "/api/admin/orders"
          headers:
            Authorization: "Bearer {{ adminToken }}"

  # 低頻場景 - 5% 流量
  - name: "庫存更新"
    weight: 3
    flow:
      - function: "authenticateAdmin"
      - post:
          url: "/api/admin/inventory/restock"
          headers:
            Authorization: "Bearer {{ adminToken }}"
          json:
            product_id: "{{ $randomInt(1, 50) }}"
            quantity: "{{ $randomInt(10, 100) }}"

  - name: "報告生成"
    weight: 2
    flow:
      - function: "authenticateAdmin"
      - get:
          url: "/api/admin/reports/daily-summary"
          headers:
            Authorization: "Bearer {{ adminToken }}"
```

## 測試執行清單

### 預測試檢查
- [ ] 所有應用服務正常運行
- [ ] 資料庫連接穩定
- [ ] 測試資料已初始化
- [ ] 監控工具已啟動
- [ ] 備份點已建立

### 執行步驟
```bash
# 1. 環境準備
npm run test:env:setup

# 2. 輕量級冒煙測試
artillery run performance-tests/smoke-test.yml

# 3. 單一場景測試
artillery run performance-tests/artillery-customer-journey.yml
artillery run performance-tests/artillery-admin-operations.yml
k6 run performance-tests/k6-websocket-load.js

# 4. 資料庫專項測試
psql -f performance-tests/jsonb-snapshot-load.sql

# 5. 綜合壓力測試
artillery run performance-tests/artillery-mixed-load.yml

# 6. 結果分析
npm run test:analyze-results
```

### 後測試檢查
- [ ] 服務狀態確認
- [ ] 錯誤日誌檢查  
- [ ] 效能指標分析
- [ ] 資料完整性驗證
- [ ] 清理測試資料

## 🚨 故障場景測試

### 模擬故障情況
```yaml
# artillery-chaos-test.yml
config:
  target: 'http://localhost:5174'
  phases:
    - duration: 300
      arrivalRate: 20

scenarios:
  - name: "資料庫連接中斷模擬"
    weight: 30
    flow:
      # 正常請求後立即大量請求
      - get:
          url: "/api/products"
      - loop:
          count: 10
          over: "request"
          whileTrue: "template"
          each:
            - post:
                url: "/api/orders"
                json:
                  customer_id: "{{ $randomInt(1, 100) }}"
                  items: []
                ifTrue: "template"

  - name: "記憶體洩漏模擬"
    weight: 20
    flow:
      - loop:
          count: 100
          each:
            - get:
                url: "/api/products?include=inventory,reviews,related"
```

## 相關文檔

- [效能測試指南](./performance-testing.md)
- [效能監控設置](./performance-monitoring.md) 
- [整合測試流程](./integration-testing.md)
- [資料庫運維指南](../../03-operations/database/README.md)

---

*最後更新: $(date "+%Y-%m-%d")*  
*測試工具版本: Artillery 2.x, k6 0.46+, PostgreSQL 15*