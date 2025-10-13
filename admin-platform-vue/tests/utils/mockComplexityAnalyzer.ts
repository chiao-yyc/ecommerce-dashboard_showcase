/**
 * Mock 複雜度分析工具
 * 自動化檢測測試文件中的Mock技術債務，產生優化建議
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, extname, relative } from 'path'

// Mock 複雜度評分標準
export interface MockComplexityMetrics {
  filePath: string
  fileName: string
  totalLines: number
  mockLines: number
  mockBlocks: number
  uiMockCount: number
  composableMockCount: number
  serviceMockCount: number
  complexityScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
}

// Mock 分類正規表達式
const MOCK_PATTERNS = {
  // UI Mock patterns
  uiMock: [
    /vi\.mock\(['"`]@\/components\/ui\//,
    /vi\.mock\(['"`][^'"`]*ui[^'"`]*['"`]/,
    /template:\s*['"`].*<[^>]+>.*['"`]/,
    /stubs:\s*{[^}]+}/,
  ],
  
  // Composable Mock patterns  
  composableMock: [
    /vi\.mock\(['"`]@\/composables\//,
    /vi\.mock\(['"`]vue['"`]/,
    /vi\.mock\(['"`]pinia['"`]/,
  ],
  
  // Service Mock patterns
  serviceMock: [
    /vi\.mock\(['"`]@\/api\//,
    /vi\.mock\(['"`]@\/lib\//,
    /vi\.mock\(['"`]@\/services\//,
  ],
  
  // General vi.mock usage
  generalMock: /vi\.mock\(/g,
  
  // Mock setup complexity indicators
  complexSetup: [
    /beforeEach.*vi\..*mock/,
    /afterEach.*vi\..*mock/,
    /mockImplementation.*=>/,
    /mockReturnValue.*{[^}]{50,}}/,  // Long mock return values
  ]
}

export class MockComplexityAnalyzer {
  private baseDir: string
  private results: MockComplexityMetrics[] = []

  constructor(baseDir: string = '') {
    this.baseDir = baseDir || join(process.cwd(), 'tests')
  }

  /**
   * 分析單個測試檔案的Mock複雜度
   */
  analyzeFile(filePath: string): MockComplexityMetrics {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    const fileName = relative(this.baseDir, filePath)

    // 基本指標
    const totalLines = lines.length
    let mockLines = 0
    let mockBlocks = 0
    let uiMockCount = 0
    let composableMockCount = 0
    let serviceMockCount = 0

    // Mock 行數統計
    const mockLineNumbers: number[] = []
    let inMockBlock = false
    let mockBlockDepth = 0

    lines.forEach((line, index) => {
      // 檢測 vi.mock 開始
      
      // 檢測 vi.mock 開始
      if (MOCK_PATTERNS.generalMock.test(line)) {
        mockBlocks++
        inMockBlock = true
        mockBlockDepth = 0
      }

      // 在Mock block內
      if (inMockBlock) {
        mockLines++
        mockLineNumbers.push(index + 1)
        
        // 計算括號深度來判斷Mock block結束
        for (const char of line) {
          if (char === '{' || char === '(') mockBlockDepth++
          if (char === '}' || char === ')') mockBlockDepth--
        }
        
        if (mockBlockDepth <= 0 && (line.includes('})') || line.includes('})'))) {
          inMockBlock = false
        }
      }

      // UI Mock 計數
      MOCK_PATTERNS.uiMock.forEach(pattern => {
        if (pattern.test(line)) uiMockCount++
      })

      // Composable Mock 計數
      MOCK_PATTERNS.composableMock.forEach(pattern => {
        if (pattern.test(line)) composableMockCount++
      })

      // Service Mock 計數
      MOCK_PATTERNS.serviceMock.forEach(pattern => {
        if (pattern.test(line)) serviceMockCount++
      })
    })

    // 計算複雜度分數 (0-100)
    const complexityScore = this.calculateComplexityScore({
      totalLines,
      mockLines,
      mockBlocks,
      uiMockCount,
      composableMockCount,
      serviceMockCount
    })

    // 判斷風險等級
    const riskLevel = this.assessRiskLevel(complexityScore, mockLines)

    // 產生建議
    const recommendations = this.generateRecommendations({
      mockLines,
      uiMockCount,
      complexityScore,
      fileName
    })

    return {
      filePath,
      fileName,
      totalLines,
      mockLines,
      mockBlocks,
      uiMockCount,
      composableMockCount,
      serviceMockCount,
      complexityScore,
      riskLevel,
      recommendations
    }
  }

  /**
   * 計算Mock複雜度分數
   */
  private calculateComplexityScore(metrics: {
    totalLines: number
    mockLines: number
    mockBlocks: number
    uiMockCount: number
    composableMockCount: number
    serviceMockCount: number
  }): number {
    const { totalLines, mockLines, mockBlocks, uiMockCount, composableMockCount, serviceMockCount } = metrics
    
    // 基礎分數：Mock行數佔比
    const mockRatio = (mockLines / Math.max(totalLines, 1)) * 100
    let score = mockRatio * 0.4  // 40% 權重

    // Mock block 數量懲罰
    score += Math.min(mockBlocks * 5, 30)  // 最多30分

    // UI Mock 重懲罰（技術債務主要來源）
    score += uiMockCount * 8  // 每個UI Mock +8分

    // Composable Mock 中度懲罰
    score += composableMockCount * 3  // 每個Composable Mock +3分

    // Service Mock 輕度懲罰（通常是好的）
    score += serviceMockCount * 1  // 每個Service Mock +1分

    return Math.min(Math.round(score), 100)
  }

  /**
   * 評估風險等級
   */
  private assessRiskLevel(complexityScore: number, mockLines: number): 'low' | 'medium' | 'high' | 'critical' {
    if (complexityScore >= 80 || mockLines > 100) return 'critical'
    if (complexityScore >= 60 || mockLines > 50) return 'high'
    if (complexityScore >= 30 || mockLines > 20) return 'medium'
    return 'low'
  }

  /**
   * 產生優化建議
   */
  private generateRecommendations(context: {
    mockLines: number
    uiMockCount: number
    complexityScore: number
    fileName: string
  }): string[] {
    const { mockLines, uiMockCount, complexityScore, fileName } = context
    const recommendations: string[] = []

    // 基於Mock行數的建議
    if (mockLines > 80) {
      recommendations.push('❌ 極高Mock複雜度，考慮拆分測試或採用替代策略')
    } else if (mockLines > 50) {
      recommendations.push('⚠️ 高Mock複雜度，建議簡化Mock設置')
    } else if (mockLines > 30) {
      recommendations.push('🟡 中等Mock複雜度，可考慮優化')
    }

    // 基於UI Mock的建議
    if (uiMockCount > 5) {
      recommendations.push('🎨 考慮使用Storybook進行視覺測試，減少UI Mock依賴')
    } else if (uiMockCount > 3) {
      recommendations.push('🔧 考慮使用componentMockFactory標準化UI Mock')
    }

    // 基於檔案類型的建議
    if (fileName.includes('components/')) {
      if (complexityScore > 60) {
        recommendations.push('🏗️ Component測試複雜度過高，建議採用簡化Mock策略')
      }
      recommendations.push('📖 參考componentMockFactory的標準模式')
    } else if (fileName.includes('views/')) {
      recommendations.push('👁️ View測試建議採用簡化掛載驗證模式')
    } else if (fileName.includes('api/')) {
      if (complexityScore < 20) {
        recommendations.push('✅ 良好的API測試Mock模式，可作為標準參考')
      }
    }

    // 通用建議
    if (complexityScore > 70) {
      recommendations.push('🚫 建議重新評估測試策略，可能需要戰略性簡化')
    }

    return recommendations.length > 0 ? recommendations : ['✅ Mock複雜度合理']
  }

  /**
   * 掃描目錄分析所有測試文件
   */
  async scanDirectory(directory: string = this.baseDir): Promise<MockComplexityMetrics[]> {
    const results: MockComplexityMetrics[] = []
    
    const scanRecursive = (dir: string) => {
      const items = readdirSync(dir)
      
      for (const item of items) {
        const fullPath = join(dir, item)
        const stat = statSync(fullPath)
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanRecursive(fullPath)
        } else if (stat.isFile() && this.isTestFile(item)) {
          const metrics = this.analyzeFile(fullPath)
          results.push(metrics)
        }
      }
    }

    if (existsSync(directory)) {
      scanRecursive(directory)
    }

    this.results = results.sort((a, b) => b.complexityScore - a.complexityScore)
    return this.results
  }

  /**
   * 檢查是否為測試檔案
   */
  private isTestFile(fileName: string): boolean {
    const ext = extname(fileName)
    return (ext === '.ts' || ext === '.js') && 
           (fileName.includes('.test.') || fileName.includes('.spec.'))
  }

  /**
   * 產生分析報告
   */
  generateReport(): {
    summary: {
      totalFiles: number
      criticalRisk: number
      highRisk: number
      mediumRisk: number
      lowRisk: number
      averageComplexity: number
      totalMockLines: number
    }
    topComplexFiles: MockComplexityMetrics[]
    recommendations: {
      immediate: string[]
      shortTerm: string[]
      longTerm: string[]
    }
  } {
    const summary = {
      totalFiles: this.results.length,
      criticalRisk: this.results.filter(r => r.riskLevel === 'critical').length,
      highRisk: this.results.filter(r => r.riskLevel === 'high').length,
      mediumRisk: this.results.filter(r => r.riskLevel === 'medium').length,
      lowRisk: this.results.filter(r => r.riskLevel === 'low').length,
      averageComplexity: Math.round(
        this.results.reduce((sum, r) => sum + r.complexityScore, 0) / Math.max(this.results.length, 1)
      ),
      totalMockLines: this.results.reduce((sum, r) => sum + r.mockLines, 0)
    }

    const topComplexFiles = this.results.slice(0, 10)

    const recommendations = {
      immediate: [
        `🚨 ${summary.criticalRisk} 個檔案需要立即處理（Critical風險）`,
        `⚠️ ${summary.highRisk} 個檔案需要優先處理（High風險）`,
        '🎯 專注於UI Mock數量 > 5的檔案，考慮Storybook替代方案'
      ],
      shortTerm: [
        '🏗️ 建立componentMockFactory標準模式使用指引',
        '📝 為Medium風險檔案制定簡化計劃',
        '🔄 推廣已驗證的簡化Mock模式'
      ],
      longTerm: [
        '📚 建立Mock最佳實踐文檔',
        '🎨 完整Storybook視覺測試環境',
        '🤖 自動化Mock複雜度監控CI/CD整合'
      ]
    }

    return { summary, topComplexFiles, recommendations }
  }

  /**
   * 輸出Markdown格式報告
   */
  generateMarkdownReport(): string {
    const report = this.generateReport()
    const timestamp = new Date().toISOString().split('T')[0]
    
    return `# Mock 複雜度分析報告

*生成時間: ${timestamp}*

## 📊 總覽統計

| 指標 | 數值 |
|------|------|
| 總測試檔案數 | ${report.summary.totalFiles} |
| 平均複雜度分數 | ${report.summary.averageComplexity}/100 |
| 總Mock行數 | ${report.summary.totalMockLines.toLocaleString()} |
| **Critical風險** | 🔴 ${report.summary.criticalRisk} 檔案 |
| **High風險** | 🟠 ${report.summary.highRisk} 檔案 |
| **Medium風險** | 🟡 ${report.summary.mediumRisk} 檔案 |
| **Low風險** | 🟢 ${report.summary.lowRisk} 檔案 |

## 🎯 重點關注檔案

${report.topComplexFiles.slice(0, 5).map((file, index) => `
### ${index + 1}. \`${file.fileName}\`
- **複雜度分數**: ${file.complexityScore}/100
- **風險等級**: ${this.getRiskEmoji(file.riskLevel)} ${file.riskLevel.toUpperCase()}
- **Mock行數**: ${file.mockLines}/${file.totalLines} (${Math.round(file.mockLines/file.totalLines*100)}%)
- **UI Mock數量**: ${file.uiMockCount}
- **建議**:
${file.recommendations.map(rec => `  - ${rec}`).join('\n')}
`).join('')}

## 💡 優化建議

### 🚨 立即執行
${report.recommendations.immediate.map(rec => `- ${rec}`).join('\n')}

### 📅 短期規劃 (1-2週)
${report.recommendations.shortTerm.map(rec => `- ${rec}`).join('\n')}

### 🔮 長期目標 (1個月+)
${report.recommendations.longTerm.map(rec => `- ${rec}`).join('\n')}

## 📈 ROI 分析

基於分析結果，建議的投資優先序：

1. **高ROI**: 修復Critical/High風險的Component層測試
2. **中ROI**: 標準化Medium風險的Mock模式
3. **長期ROI**: 建立Storybook替代UI Mock

**預期效益**:
- 減少 ${Math.round(report.summary.totalMockLines * 0.3)} 行Mock維護負擔
- 提升 ${Math.round((report.summary.criticalRisk + report.summary.highRisk) * 0.8)} 個檔案的測試穩定性
- 降低新人學習曲線 50%

---
*此報告由Mock複雜度分析工具自動生成*`
  }

  private getRiskEmoji(risk: string): string {
    const emojis = {
      critical: '🔴',
      high: '🟠', 
      medium: '🟡',
      low: '🟢'
    }
    return emojis[risk as keyof typeof emojis] || '⚪'
  }
}

// 導出便利函數
export async function analyzeMockComplexity(baseDir?: string): Promise<MockComplexityMetrics[]> {
  const analyzer = new MockComplexityAnalyzer(baseDir)
  return await analyzer.scanDirectory()
}

export async function generateMockComplexityReport(baseDir?: string): Promise<string> {
  const analyzer = new MockComplexityAnalyzer(baseDir)
  await analyzer.scanDirectory()
  return analyzer.generateMarkdownReport()
}