/**
 * API Client for Frontend Integration
 * Use this in your React app to connect to the backend
 */

import { getAuthenticatedUser } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class FakeNewsAPI {
  static getCurrentUserEmail() {
    return (getAuthenticatedUser()?.email || '').trim().toLowerCase();
  }

  /**
   * Check backend health
   */
  static async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  }

  /**
   * Predict if text is fake or real news
   * @param {string} text - News text to analyze
   * @param {boolean} verifyClaims - Whether to verify financial/crypto claims
   */
  static async predictText(text, verifyClaims = false) {
    const userEmail = FakeNewsAPI.getCurrentUserEmail();
    const response = await fetch(`${API_BASE_URL}/predict-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        verify_claims: verifyClaims,
        user_email: userEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Prediction failed');
    }

    return response.json();
  }

  /**
   * Direct ML prediction endpoint.
   * @param {string} text - News text to classify with the trained model
   */
  static async mlPredict(text) {
    const response = await fetch(`${API_BASE_URL}/ml-predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'ML prediction failed');
    }

    return response.json();
  }

  /**
   * Scrape URL and predict if content is fake or real
   * @param {string} url - Article URL to analyze
   * @param {boolean} verifyClaims - Whether to verify claims
   */
  static async predictURL(url, verifyClaims = false) {
    const userEmail = FakeNewsAPI.getCurrentUserEmail();
    const response = await fetch(`${API_BASE_URL}/predict-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        verify_claims: verifyClaims,
        user_email: userEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'URL prediction failed');
    }

    return response.json();
  }

  /**
   * Extract text from image using OCR and predict
   * @param {File} imageFile - Image file to analyze
   */
  static async predictImage(imageFile) {
    const userEmail = FakeNewsAPI.getCurrentUserEmail();
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('user_email', userEmail);

    const response = await fetch(`${API_BASE_URL}/predict-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Image prediction failed');
    }

    return response.json();
  }

  /**
   * Verify specific claims in real-time
   * @param {string} text - Text containing claims
   * @param {string} claimType - Type of claim (crypto_price, financial_stat, auto)
   */
  static async verifyClaim(text, claimType = 'auto') {
    const userEmail = FakeNewsAPI.getCurrentUserEmail();
    const response = await fetch(`${API_BASE_URL}/verify-claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        claim_type: claimType,
        user_email: userEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Claim verification failed');
    }

    return response.json();
  }

  /**
   * Check credibility of a news source
   * @param {string} url - URL or domain to check
   */
  static async checkSourceCredibility(url) {
    const response = await fetch(`${API_BASE_URL}/source-credibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Source check failed');
    }

    return response.json();
  }

  /**
   * Get analytics data
   */
  static async getAnalytics(days = 30) {
    const userEmail = FakeNewsAPI.getCurrentUserEmail();
    const params = new URLSearchParams({ days: String(days) });
    if (userEmail) params.append('user_email', userEmail);

    const response = await fetch(`${API_BASE_URL}/analytics?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch analytics');
    }

    return response.json();
  }

  /**
   * Get prediction history
   * @param {number} limit - Number of predictions to fetch
   * @param {string} type - Filter by type (text/url/image/claim)
   */
  static async getHistory(limit = 50, type = null) {
    const userEmail = FakeNewsAPI.getCurrentUserEmail();
    const params = new URLSearchParams({ limit: limit.toString() });
    if (type) params.append('type', type);
    if (userEmail) params.append('user_email', userEmail);
    
    const response = await fetch(`${API_BASE_URL}/history?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch history');
    }

    return response.json();
  }

  /**
   * Get overall database statistics
   */
  static async getStats() {
    const userEmail = FakeNewsAPI.getCurrentUserEmail();
    const params = new URLSearchParams();
    if (userEmail) params.append('user_email', userEmail);
    const response = await fetch(`${API_BASE_URL}/stats${params.toString() ? `?${params.toString()}` : ''}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch stats');
    }

    return response.json();
  }

  /**
   * Get current ML model metrics artifact.
   */
  static async getModelMetrics() {
    const response = await fetch(`${API_BASE_URL}/model-metrics`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch model metrics');
    }

    return response.json();
  }

  /**
   * Get user profile.
   */
  static async getProfile(userEmail = '') {
    const params = new URLSearchParams();
    if (userEmail) params.append('user_email', userEmail);

    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/profile?${queryString}` : `${API_BASE_URL}/profile`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    }

    return response.json();
  }

  /**
   * Save user profile.
   */
  static async saveProfile(profile, userEmail = '') {
    const payload = {
      ...profile,
      user_email: userEmail,
    };

    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save profile');
    }

    return response.json();
  }

  /**
   * Change user password.
   */
  static async changePassword(payload: { userEmail: string; currentPassword: string; newPassword: string }) {
    const response = await fetch(`${API_BASE_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_email: payload.userEmail,
        current_password: payload.currentPassword,
        new_password: payload.newPassword,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change password');
    }

    return response.json();
  }

  /**
   * Delete account and user-scoped data.
   */
  static async deleteAccount(userEmail: string) {
    const response = await fetch(`${API_BASE_URL}/delete-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_email: userEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete account');
    }

    return response.json();
  }
}

export default FakeNewsAPI;
