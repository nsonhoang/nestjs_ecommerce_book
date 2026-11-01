export interface ISagaStep<TContext> {
  readonly name: string;
  execute(context: TContext): Promise<void>;
  compensate(context: TContext): Promise<void>;
}
