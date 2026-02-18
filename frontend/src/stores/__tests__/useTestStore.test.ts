import { useTestStore } from '../useTestStore';

describe('useTestStore', () => {
  beforeEach(() => {
    useTestStore.getState().reset();
  });

  it('should start with count 0', () => {
    expect(useTestStore.getState().count).toBe(0);
  });

  it('should increment count', () => {
    useTestStore.getState().increment();
    expect(useTestStore.getState().count).toBe(1);
  });

  it('should decrement count', () => {
    useTestStore.getState().increment();
    useTestStore.getState().increment();
    useTestStore.getState().decrement();
    expect(useTestStore.getState().count).toBe(1);
  });

  it('should reset count', () => {
    useTestStore.getState().increment();
    useTestStore.getState().increment();
    useTestStore.getState().reset();
    expect(useTestStore.getState().count).toBe(0);
  });
});
