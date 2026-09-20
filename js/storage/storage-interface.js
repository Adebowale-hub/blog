/**
 * STORAGE INTERFACE
 * Abstract contract for blog post persistence.
 */

export class StorageInterface {
  async getPosts() {
    throw new Error('getPosts() must be implemented');
  }

  async getPost(id) {
    throw new Error('getPost() must be implemented');
  }

  async savePost(post, adminKey) {
    throw new Error('savePost() must be implemented');
  }

  async deletePost(id, adminKey) {
    throw new Error('deletePost() must be implemented');
  }
}
