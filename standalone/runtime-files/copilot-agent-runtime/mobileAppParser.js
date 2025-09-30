// mobileAppParser.js — hardened replacement

const CONFIG = {
  MOBILE_PATTERNS: {
    ecommerce: /e-?commerce|shopping|store|marketplace/i,
    social: /social|chat|messaging|community/i,
    fitness: /fitness|health|workout|tracking/i,
    productivity: /productivity|organizer|planner|task/i,
    entertainment: /game|entertainment|media|streaming/i,
    education: /education|learning|course|tutorial/i,
    finance: /finance|banking|payment|wallet/i,
    travel: /travel|booking|navigation|maps/i
  },
  FEATURE_PATTERNS: {
    camera: /camera|photo|image|video/i,
    notifications: /notification|push|alert/i,
    offline: /offline|cache|sync/i,
    payment: /payment|purchase|billing|monetization/i,
    auth: /login|auth|signin|signup/i,
    geolocation: /location|gps|maps|navigation/i,
    analytics: /analytics|tracking|metrics/i,
    ads: /ads|advertisement|monetization/i
  },
  PLATFORM_PATTERNS: {
    ios: /ios|iphone|ipad|apple/i,
    android: /android|google|play store/i,
    web: /web|browser|pwa/i,
    desktop: /desktop|electron|windows|mac/i
  },
  DEFAULT_PLATFORMS: ['ios', 'android'],
  MONETIZATION_PATTERNS: {
    subscription: /premium|paid|subscription/i,
    ads: /ads|advertisement/i,
    freemium: /freemium/i
  },
  FRAMEWORK_PATTERNS: {
    flutter: /flutter/i,
    native: /native|swift|kotlin/i,
    ionic: /ionic/i
  },
  DEFAULT_TEMPLATE: {
    components: [],
    features: [],
    navigation: 'stack-navigator'
  }
};

export class MobileAppParser {
  static logEvent(type, detail) {
    const stamp = new Date().toISOString();
    console.info(`[${stamp}][${type}]`, detail);
  }

  static parse(intent) {
    try {
      if (!intent || typeof intent !== 'string') throw new Error('Intent must be a string');

      const parsed = {
        appType: 'general',
        features: [],
        platforms: [],
        monetization: 'free',
        framework: 'react-native'
      };

      // App type
      for (const [type, pattern] of Object.entries(CONFIG.MOBILE_PATTERNS)) {
        if (pattern.test(intent)) { parsed.appType = type; break; }
      }

      // Features
      for (const [feature, pattern] of Object.entries(CONFIG.FEATURE_PATTERNS)) {
        if (pattern.test(intent)) parsed.features.push(feature);
      }

      // Platforms
      for (const [platform, pattern] of Object.entries(CONFIG.PLATFORM_PATTERNS)) {
        if (pattern.test(intent)) parsed.platforms.push(platform);
      }
      if (parsed.platforms.length === 0) parsed.platforms = CONFIG.DEFAULT_PLATFORMS;

      // Monetization
      for (const [type, pattern] of Object.entries(CONFIG.MONETIZATION_PATTERNS)) {
        if (pattern.test(intent)) { parsed.monetization = type; break; }
      }

      // Framework
      for (const [fw, pattern] of Object.entries(CONFIG.FRAMEWORK_PATTERNS)) {
        if (pattern.test(intent)) { parsed.framework = fw; break; }
      }

      this.logEvent('MobileAppParser:parsed', parsed);
      return parsed;
    } catch (err) {
      this.logEvent('MobileAppParser:error', { error: err.message, intent });
      return { error: err.message };
    }
  }

  static generateAppTemplate(parsedIntent) {
    const templates = {
      ecommerce: {
        components: ['product-list', 'cart', 'checkout', 'user-profile'],
        features: ['payment', 'notifications', 'offline'],
        navigation: 'tab-navigator'
      },
      social: {
        components: ['feed', 'chat', 'profile', 'friends'],
        features: ['camera', 'notifications', 'auth'],
        navigation: 'stack-navigator'
      },
      fitness: {
        components: ['workout-tracker', 'progress', 'goals', 'stats'],
        features: ['geolocation', 'notifications', 'analytics'],
        navigation: 'drawer-navigator'
      },
      general: CONFIG.DEFAULT_TEMPLATE
    };

    return templates[parsedIntent.appType] || CONFIG.DEFAULT_TEMPLATE;
  }
}
