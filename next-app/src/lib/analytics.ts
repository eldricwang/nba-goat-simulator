// 埋点系统 - 轻量级分析工具

interface AnalyticsEvent {
  event: string;
  data?: Record<string, any>;
  timestamp: number;
  userAgent: string;
  url: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private readonly MAX_EVENTS = 100;

  constructor() {
    // 在页面卸载时发送剩余事件
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.sendPendingEvents();
      });
    }
  }

  // 记录事件
  track(event: string, data?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      data,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.events.push(analyticsEvent);
    
    // 如果事件过多，清理旧事件
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // 尝试发送事件（使用 sendBeacon 避免阻塞页面卸载）
    this.sendEvent(analyticsEvent);
    
    // 预留 GA4/Plausible 集成点
    this.integrateWithExternalAnalytics(event, data);
  }

  // 发送单个事件
  private sendEvent(event: AnalyticsEvent) {
    try {
      // 使用 sendBeacon 发送事件（不会阻塞页面卸载）
      const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics', blob);
    } catch (error) {
      console.warn('Analytics event failed to send:', error);
    }
  }

  // 发送所有待处理事件
  private sendPendingEvents() {
    if (this.events.length === 0) return;

    try {
      const blob = new Blob([JSON.stringify(this.events)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics', blob);
      this.events = [];
    } catch (error) {
      console.warn('Pending analytics events failed to send:', error);
    }
  }

  // 外部分析服务集成（预留接口）
  private integrateWithExternalAnalytics(event: string, data?: Record<string, any>) {
    // GA4 集成
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, data);
    }

    // Plausible 集成
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(event, { props: data });
    }
  }

  // 页面浏览事件
  pageView(page: string) {
    this.track('page_view', { page });
  }

  // 对比查看事件
  compareView(player1: string, player2: string, mode: string) {
    this.track('compare_view', { player1, player2, mode });
  }

  // 卡片生成事件
  cardGenerate(player1: string, player2: string, mode: string) {
    this.track('card_generate', { player1, player2, mode });
  }

  // 卡片下载事件
  cardDownload(player1: string, player2: string, mode: string, lang: string) {
    this.track('card_download', { player1, player2, mode, lang });
  }

  // 分享链接复制事件
  shareLinkCopy(player1: string, player2: string, mode: string) {
    this.track('share_link_copy', { player1, player2, mode });
  }

  // 预设对比点击事件
  presetComparisonClick(presetName: string) {
    this.track('preset_comparison_click', { presetName });
  }
}

// 创建全局实例
export const analytics = new Analytics();

// 使用示例：
// analytics.pageView('compare');
// analytics.compareView('Michael Jordan', 'LeBron James', 'career');