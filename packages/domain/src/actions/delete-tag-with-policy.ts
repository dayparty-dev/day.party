import type { TagRepository } from '../interfaces/tag-repository';
import type { TaskRepository } from '../interfaces/task-repository';

export type DeleteTagWithPolicyResult = {
  deletedTagId: string;
  affectedTaskCount: number;
};

export function makeDeleteTagWithPolicyAction(tagRepo: TagRepository, taskRepo: TaskRepository) {
  return async function deleteTagWithPolicy(
    userId: string,
    tagId: string,
    replacementTagId: string | null | undefined,
  ): Promise<DeleteTagWithPolicyResult> {
    const tag = await tagRepo.findByIdForUser(userId, tagId);
    if (!tag) {
      throw new Error('TAG_NOT_FOUND');
    }
    let replacementKey: string | null = null;
    if (replacementTagId) {
      if (replacementTagId === tagId) {
        throw new Error('TAG_REPLACE_SELF');
      }
      const repl = await tagRepo.findByIdForUser(userId, replacementTagId);
      if (!repl) {
        throw new Error('TAG_REPLACE_NOT_FOUND');
      }
      replacementKey = repl.key;
    }
    const affectedTaskCount = await taskRepo.applyTagDeletionPolicy(userId, tag.key, replacementKey);
    await tagRepo.delete(tagId);
    return { deletedTagId: tagId, affectedTaskCount };
  };
}
