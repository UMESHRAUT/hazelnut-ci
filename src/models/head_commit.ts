export interface HeadCommit {
  id: string;

  tree_id: string;

  distinct: boolean;

  message: string;

  timestamp: string;

  url: string;

  author: GitAuthor;

  committer: GitAuthor;

  added: Array<string>;

  removed: Array<string>;

  modified: Array<string>;
}

interface GitAuthor {
  name: string;

  email: string;

  username: string;
}
