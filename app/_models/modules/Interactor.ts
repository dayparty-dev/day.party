export interface Interactor<Input, Output> {
  interact(input: Input): Promise<Output>;
}
