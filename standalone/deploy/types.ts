export interface AgentExecutor {
  execute: (payload: any) => Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: any;
  }>;
}
