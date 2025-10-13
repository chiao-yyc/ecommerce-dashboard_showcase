# Faker Seed Module

> 為 Demo / 測試快速生成假資料並寫入 Supabase

## 技術棧
| 套件                | 用途                     |
|---------------------|--------------------------|
| `@faker-js/faker`   | 產生隨機姓名、商品、數字 |
| Supabase JS SDK v2  | 連線 DB、批次 `insert`   |
| `drizzle-kit` (可選)| 型別安全 SQL Builder     |

---

## 模組結構

```
src/lib/faker/
 ├─ fakeUsers.ts
 ├─ fakeProducts.ts
 ├─ fakeOrders.ts
 └─ index.ts          # generateAll()
```

### 範例：`fakeOrders.ts`

```ts
import { faker } from '@faker-js/faker';
import { supabase } from '@/lib/supabase';

export const generateFakeOrders = async (count = 20) => {
  const orders = Array.from({ length: count }).map(() => ({
    id: faker.string.uuid(),
    user_id: faker.helpers.arrayElement(fakerUserIds),
    status: faker.helpers.arrayElement(['paid', 'pending', 'cancelled']),
    total_amount: faker.commerce.price({ min: 20, max: 500 }),
    created_at: faker.date.recent({ days: 14 }),
  }));

  return await supabase.from('orders').insert(orders);
};
```

---

## 更新策略

1. 將 **productId pool** 與 **userId pool** 預先查出放記憶體  
2. 每次 Demo 前 `truncate` 相關表並重新 `seed`  
3. 以 `is_test_data` (boolean) 標記便於後續清除

---

## 測試資料規模

| 類別     | 預設筆數 | 參數化                       |
|----------|---------|------------------------------|
| Users    | 50      | `generateFakeUsers(100)`     |
| Products | 40      | `generateFakeProducts(40)`   |
| Orders   | 100     | `generateFakeOrders(100)`    |
| Messages | 200     | `generateFakeMessages(200)`  |

> 建議配合按鈕觸發一次性產生，避免重複插入。
