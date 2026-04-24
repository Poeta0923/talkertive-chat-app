import { AsyncLocalStorage } from 'async_hooks';

interface RequestStore {
  requestId: string;
}

// 요청 단위 비동기 컨텍스트 — 미들웨어에서 저장하면 서비스·레포지토리까지 전파됨
const storage = new AsyncLocalStorage<RequestStore>();

export const RequestContext = {
  /**
   * 미들웨어에서 호출 — 이 run() 블록 안의 모든 비동기 호출이 동일한 store를 공유한다.
   */
  run<T>(requestId: string, fn: () => T): T {
    return storage.run({ requestId }, fn);
  },

  /**
   * 서비스·인터셉터·필터 등 어디서든 requestId를 꺼낼 수 있다.
   * 미들웨어 컨텍스트 밖에서 호출되면 undefined를 반환한다.
   */
  getRequestId(): string | undefined {
    return storage.getStore()?.requestId;
  },
};
