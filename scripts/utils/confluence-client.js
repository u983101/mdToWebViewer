import axios from 'axios';

/**
 * Confluence API client for authentication and CRUD operations
 */

export class ConfluenceClient {
  /**
   * Create a new Confluence client
   * @param {Object} auth - Authentication object
   * @param {string} auth.username - Confluence username
   * @param {string} auth.password - Confluence password or API token
   * @param {string} auth.baseUrl - Confluence base URL
   */
  constructor(auth) {
    this.baseUrl = auth.baseUrl.replace(/\/$/, '');
    this.auth = auth;
    
    // Create axios instance with basic auth
    this.api = axios.create({
      baseURL: `${this.baseUrl}/rest/api`,
      auth: {
        username: auth.username,
        password: auth.password
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Test connection to Confluence
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      const response = await this.api.get('/user/current');
      console.log(`✅ Connected to Confluence as: ${response.data.displayName}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Confluence:', error.message);
      if (error.response) {
        console.error(`Status: ${error.response.status}, Message: ${error.response.statusText}`);
      }
      return false;
    }
  }

  /**
   * Search for pages by title in a space
   * @param {string} spaceKey - Confluence space key
   * @param {string} title - Page title to search for
   * @returns {Promise<ConfluencePage[]>} Array of matching pages
   */
  async searchPages(spaceKey, title) {
    try {
      const response = await this.api.get('/content/search', {
        params: {
          cql: `space="${spaceKey}" and title="${title}"`,
          expand: 'version,ancestors'
        }
      });
      
      return response.data.results;
    } catch (error) {
      console.log(error)
      const errorMessage = this.formatErrorMessage(error, `searching for page "${title}" in space "${spaceKey}"`);
      console.error(`Error searching for page "${title}" in space "${spaceKey}":`, errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get page by title in a space
   * @param {string} spaceKey - Confluence space key
   * @param {string} title - Page title
   * @returns {Promise<ConfluencePage|null>} Page object or null if not found
   */
  async getPageByTitle(spaceKey, title) {
    try {
      const pages = await this.searchPages(spaceKey, title);
      return pages.length > 0 ? pages[0] : null;
    } catch (error) {
      const errorMessage = this.formatErrorMessage(error, `getting page "${title}" from space "${spaceKey}"`);
      console.error(`Error getting page "${title}" from space "${spaceKey}":`, errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a new page in Confluence
   * @param {Object} pageData - Page data
   * @param {string} pageData.title - Page title
   * @param {string} pageData.space - Space key
   * @param {string} pageData.body - Page content in storage format
   * @param {string} pageData.type - Page type (default: "page")
   * @param {Array} pageData.ancestors - Array of ancestor page IDs
   * @returns {Promise<ConfluencePage>} Created page object
   */
  async createPage(pageData) {
    try {
      
      if (pageData.type === undefined) {
        pageData.type = 'page';
      }
      const page = {
        title: pageData.title,
        type: pageData.type || 'page',
        // id: pageData.space,
        space: {
          key: pageData.space
        },
        body: {
          storage: {
            value: pageData.body,
            representation: 'storage'
          }
        }
      };

      // Add ancestors if provided
      if (pageData.ancestors && pageData.ancestors.length > 0) {
        page.ancestors = pageData.ancestors.map(id => ({ id }));
      }

      const response = await this.api.post('/content', page);
      console.log(`✅ Created page: ${pageData.title}`);
      return response.data;
    } catch (error) {
      const errorMessage = this.formatErrorMessage(error, `creating page "${pageData.title}"`);
      console.error(`Error creating page "${pageData.title}":`, errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Update an existing page in Confluence
   * @param {string} pageId - Page ID to update
   * @param {Object} pageData - Page data
   * @param {string} pageData.title - Page title
   * @param {string} pageData.body - Page content in storage format
   * @param {number} pageData.version - Current version number
   * @returns {Promise<ConfluencePage>} Updated page object
   */
  async updatePage(pageId, pageData) {
    try {
      // Get current page to preserve version
      const currentPage = await this.api.get(`/content/${pageId}?expand=version`);
      
      const page = {
        id: pageId,
        title: pageData.title,
        type: 'page',
        version: {
          number: (pageData.version || currentPage.data.version.number) + 1
        },
        body: {
          storage: {
            value: pageData.body,
            representation: 'storage'
          }
        }
      };

      const response = await this.api.put(`/content/${pageId}`, page);
      console.log(`✅ Updated page: ${pageData.title}`);
      return response.data;
    } catch (error) {
      const errorMessage = this.formatErrorMessage(error, `updating page "${pageData.title}"`);
      console.error(`Error updating page "${pageData.title}":`, errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Upsert a page (create or update)
   * @param {Object} pageData - Page data
   * @param {string} pageData.title - Page title
   * @param {string} pageData.space - Space key
   * @param {string} pageData.body - Page content in storage format
   * @param {Array} pageData.ancestors - Array of ancestor page IDs
   * @param {string} pageData.parentPageId - Parent page ID (alternative to ancestors)
   * @returns {Promise<ConfluencePage>} Created or updated page object
   */
  async upsertPage(pageData) {
    try {
      // Check if page exists
      const existingPage = await this.getPageByTitle(pageData.space, pageData.title);
      
      // Handle parent page ID if provided
      if (pageData.parentPageId && !pageData.ancestors) {
        pageData.ancestors = [pageData.parentPageId];
      }
      
      if (existingPage) {
        // Update existing page
        return await this.updatePage(existingPage.id, {
          title: pageData.title,
          body: pageData.body,
          version: existingPage.version?.number
        });
      } else {
        // Create new page
        return await this.createPage(pageData);
      }
    } catch (error) {
      const errorMessage = this.formatErrorMessage(error, `upserting page "${pageData.title}"`);
      console.error(`Error upserting page "${pageData.title}":`, errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Format error messages with detailed information
   * @param {Error} error - The original error
   * @param {string} context - Context of the operation
   * @returns {string} Formatted error message
   */
  formatErrorMessage(error, context) {
    let message = `${context} failed`;
    
    if (error.response) {
      // Server responded with error status
      const { status, statusText, data } = error.response;
      message += ` with status ${status} (${statusText})`;
      
      if (data && data.message) {
        message += `: ${data.message}`;
      } else if (data && typeof data === 'string') {
        message += `: ${data}`;
      } else if (data && data.error && data.error.message) {
        message += `: ${data.error.message}`;
      }
      
      // Add URL for debugging
      if (error.config && error.config.url) {
        message += `\nURL: ${error.config.url}`;
      }
      
    } else if (error.request) {
      // Request was made but no response received
      message += `: No response received from server. Check network connectivity and URL.`;
    } else {
      // Something else happened
      message += `: ${error.message}`;
    }
    
    return message;
  }
}
