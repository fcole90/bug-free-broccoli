import { execFileSync } from 'node:child_process';
import process from 'node:process';

interface CliOptions {
  allBranchRuns: boolean;
  branch?: string;
  help: boolean;
  intervalSeconds: number;
  json: boolean;
  limit: number;
  repo?: string;
  sha?: string;
  timeoutSeconds: number;
  watch: boolean;
  workflow?: string;
}

interface WorkflowRun {
  readonly conclusion: string | null;
  readonly created_at: string;
  readonly head_branch: string;
  readonly head_sha: string;
  readonly html_url: string;
  readonly id: number;
  readonly name: string;
  readonly status: string;
  readonly updated_at: string;
}

interface WorkflowRunsResponse {
  readonly workflow_runs: readonly WorkflowRun[];
}

const successfulConclusions = new Set(['success', 'neutral', 'skipped']);

const defaultLimit = 10;
const defaultIntervalSeconds = 15;
const defaultTimeoutSeconds = 600;

const runGit = (args: readonly string[]): string | undefined => {
  try {
    return execFileSync('git', [...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
};

const readNextValue = (
  args: readonly string[],
  index: number,
  optionName: string,
): string => {
  const value = args[index + 1];

  if (value == null || value.startsWith('--')) {
    throw new Error(`Missing value for ${optionName}`);
  }

  return value;
};

const parsePositiveInteger = (value: string, optionName: string): number => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${optionName} must be a positive integer.`);
  }

  return parsedValue;
};

const parseArgs = (args: readonly string[]): CliOptions => {
  const options: CliOptions = {
    allBranchRuns: false,
    help: false,
    intervalSeconds: defaultIntervalSeconds,
    json: false,
    limit: defaultLimit,
    timeoutSeconds: defaultTimeoutSeconds,
    watch: false,
  };

  let index = 0;

  while (index < args.length) {
    const arg = args[index];

    if (arg === '--help' || arg === '-h') {
      return { ...options, help: true };
    }

    if (arg === '--all') {
      options.allBranchRuns = true;
      index += 1;
      continue;
    }

    if (arg === '--json') {
      options.json = true;
      index += 1;
      continue;
    }

    if (arg === '--watch') {
      options.watch = true;
      index += 1;
      continue;
    }

    if (arg.startsWith('--branch=')) {
      options.branch = arg.slice('--branch='.length);
      index += 1;
      continue;
    }

    if (arg === '--branch') {
      options.branch = readNextValue(args, index, arg);
      index += 2;
      continue;
    }

    if (arg.startsWith('--repo=')) {
      options.repo = arg.slice('--repo='.length);
      index += 1;
      continue;
    }

    if (arg === '--repo') {
      options.repo = readNextValue(args, index, arg);
      index += 2;
      continue;
    }

    if (arg.startsWith('--sha=')) {
      options.sha = arg.slice('--sha='.length);
      index += 1;
      continue;
    }

    if (arg === '--sha') {
      options.sha = readNextValue(args, index, arg);
      index += 2;
      continue;
    }

    if (arg.startsWith('--workflow=')) {
      options.workflow = arg.slice('--workflow='.length);
      index += 1;
      continue;
    }

    if (arg === '--workflow') {
      options.workflow = readNextValue(args, index, arg);
      index += 2;
      continue;
    }

    if (arg.startsWith('--limit=')) {
      options.limit = parsePositiveInteger(arg.slice('--limit='.length), arg);
      index += 1;
      continue;
    }

    if (arg === '--limit') {
      options.limit = parsePositiveInteger(readNextValue(args, index, arg), arg);
      index += 2;
      continue;
    }

    if (arg.startsWith('--interval=')) {
      options.intervalSeconds = parsePositiveInteger(
        arg.slice('--interval='.length),
        arg,
      );
      index += 1;
      continue;
    }

    if (arg === '--interval') {
      options.intervalSeconds = parsePositiveInteger(
        readNextValue(args, index, arg),
        arg,
      );
      index += 2;
      continue;
    }

    if (arg.startsWith('--timeout=')) {
      options.timeoutSeconds = parsePositiveInteger(
        arg.slice('--timeout='.length),
        arg,
      );
      index += 1;
      continue;
    }

    if (arg === '--timeout') {
      options.timeoutSeconds = parsePositiveInteger(
        readNextValue(args, index, arg),
        arg,
      );
      index += 2;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
};

const printHelp = (): void => {
  console.log(`Usage: yarn check-gh-actions [options]

Checks GitHub Actions runs through the GitHub REST API without requiring the gh CLI.

Options:
  --watch              Poll until matching runs complete, then exit non-zero on failed runs.
  --all                Show latest branch runs instead of filtering to the current HEAD commit.
  --branch <name>      Branch to inspect. Defaults to the current Git branch.
  --sha <sha>          Commit SHA to inspect. Defaults to HEAD unless --all is used.
  --repo <owner/repo>  Repository to inspect. Defaults to Git origin.
  --workflow <text>    Filter runs by workflow name substring.
  --limit <number>     Number of runs to fetch. Defaults to ${defaultLimit}.
  --interval <seconds> Poll interval for --watch. Defaults to ${defaultIntervalSeconds}.
  --timeout <seconds>  Timeout for --watch. Defaults to ${defaultTimeoutSeconds}.
  --json               Print the matching runs as JSON.
  --help               Show this help message.`);
};

const getCurrentBranch = (): string => {
  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);

  if (branch != null && branch !== 'HEAD') {
    return branch;
  }

  return 'main';
};

const getCurrentSha = (): string | undefined => runGit(['rev-parse', 'HEAD']);

const getGitHubRepoFromOrigin = (): string | undefined => {
  const remoteUrl = runGit(['remote', 'get-url', 'origin']);

  if (remoteUrl == null) {
    return undefined;
  }

  const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/u);

  if (match == null) {
    return undefined;
  }

  return `${match[1]}/${match[2]}`;
};

const createRequestUrl = (
  repo: string,
  branch: string,
  options: CliOptions,
): URL => {
  const requestUrl = new URL(
    `https://api.github.com/repos/${repo}/actions/runs`,
  );
  requestUrl.searchParams.set('branch', branch);
  requestUrl.searchParams.set('per_page', String(options.limit));

  if (!options.allBranchRuns && options.sha != null) {
    requestUrl.searchParams.set('head_sha', options.sha);
  }

  return requestUrl;
};

const fetchWorkflowRuns = async (
  requestUrl: URL,
  workflowFilter?: string,
): Promise<readonly WorkflowRun[]> => {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'swiftpost-check-gh-actions',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = process.env.GITHUB_TOKEN;

  if (token != null && token.length > 0) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(requestUrl, { headers });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `GitHub API request failed: ${response.status} ${response.statusText}\n${responseText}`,
    );
  }

  const payload = (await response.json()) as WorkflowRunsResponse;
  const runs = payload.workflow_runs;

  if (workflowFilter == null || workflowFilter.length === 0) {
    return runs;
  }

  const normalizedFilter = workflowFilter.toLowerCase();

  return runs.filter((run) => run.name.toLowerCase().includes(normalizedFilter));
};

const formatRunState = (run: WorkflowRun): string => {
  if (run.status === 'completed') {
    return run.conclusion ?? 'completed';
  }

  return run.status;
};

const printRuns = (
  runs: readonly WorkflowRun[],
  repo: string,
  branch: string,
  options: CliOptions,
): void => {
  if (options.json) {
    console.log(JSON.stringify(runs, null, 2));
    return;
  }

  const target = options.allBranchRuns ? branch : `${branch}@${options.sha}`;
  console.log(`GitHub Actions: ${repo} (${target})`);

  if (runs.length === 0) {
    console.log('No matching workflow runs found.');
    return;
  }

  for (const run of runs) {
    const state = formatRunState(run).padEnd(12, ' ');
    const shortSha = run.head_sha.slice(0, 7);
    const updatedAt = new Date(run.updated_at).toISOString();

    console.log(`${state} ${shortSha} ${run.name}`);
    console.log(`  updated: ${updatedAt}`);
    console.log(`  url: ${run.html_url}`);
  }
};

const hasFailedRuns = (runs: readonly WorkflowRun[]): boolean =>
  runs.some(
    (run) =>
      run.status === 'completed' &&
      run.conclusion != null &&
      !successfulConclusions.has(run.conclusion),
  );

const hasIncompleteRuns = (runs: readonly WorkflowRun[]): boolean =>
  runs.some((run) => run.status !== 'completed');

const wait = async (seconds: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
};

const checkRunsOnce = async (
  repo: string,
  branch: string,
  options: CliOptions,
): Promise<readonly WorkflowRun[]> => {
  const requestUrl = createRequestUrl(repo, branch, options);

  return fetchWorkflowRuns(requestUrl, options.workflow);
};

const run = async (): Promise<number> => {
  const parsedOptions = parseArgs(process.argv.slice(2));

  if (parsedOptions.help) {
    printHelp();
    return 0;
  }

  const repo = parsedOptions.repo ?? getGitHubRepoFromOrigin();
  const branch = parsedOptions.branch ?? getCurrentBranch();
  const sha = parsedOptions.sha ?? getCurrentSha();
  const options = { ...parsedOptions, sha };

  if (repo == null) {
    throw new Error(
      'Could not infer a GitHub repository from git remote origin. Pass --repo owner/name.',
    );
  }

  if (!options.allBranchRuns && options.sha == null) {
    throw new Error('Could not infer HEAD SHA. Pass --sha or use --all.');
  }

  const startedAt = Date.now();

  while (true) {
    const runs = await checkRunsOnce(repo, branch, options);
    printRuns(runs, repo, branch, options);

    if (runs.length === 0) {
      if (!options.watch) {
        return 1;
      }
    } else if (hasFailedRuns(runs)) {
      return 1;
    } else if (!options.watch || !hasIncompleteRuns(runs)) {
      return 0;
    }

    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);

    if (elapsedSeconds >= options.timeoutSeconds) {
      console.error(`Timed out after ${options.timeoutSeconds} seconds.`);
      return 2;
    }

    console.log(`Waiting ${options.intervalSeconds} seconds...`);
    await wait(options.intervalSeconds);
  }
};

try {
  process.exitCode = await run();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
