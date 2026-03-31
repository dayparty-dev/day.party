'use server';

import {
  CreateAuthSessionInput,
  CreateAuthSessionInteractor,
  CreateAuthSessionOutput,
} from '../_interactors/CreateAuthSessionInteractor';
import {
  DeleteAuthSessionInput,
  DeleteAuthSessionInteractor,
  DeleteAuthSessionOutput,
} from '../_interactors/DeleteAuthSessionInteractor';
import {
  VerifyAuthSessionInput,
  VerifyAuthSessionInteractor,
  VerifyAuthSessionOutput,
} from '../_interactors/VerifyAuthSessionInteractor';

const createAuthSessionInteractor = new CreateAuthSessionInteractor();
const verifyAuthSessionInteractor = new VerifyAuthSessionInteractor();
const deleteAuthSessionInteractor = new DeleteAuthSessionInteractor();

export async function createAuthSessionServer(
  input: CreateAuthSessionInput
): Promise<CreateAuthSessionOutput> {
  return await createAuthSessionInteractor.interact(input);
}

export async function verifyAuthSessionServer(
  input: VerifyAuthSessionInput
): Promise<VerifyAuthSessionOutput> {
  return await verifyAuthSessionInteractor.interact(input);
}

export async function deleteAuthSessionServer(
  input: DeleteAuthSessionInput
): Promise<DeleteAuthSessionOutput> {
  return await deleteAuthSessionInteractor.interact(input);
}
