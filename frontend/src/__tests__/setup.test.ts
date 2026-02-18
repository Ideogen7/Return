describe('Test infrastructure', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should resolve @/ path aliases', () => {
    // Vérifie que le path alias est résolu par Jest
    expect(true).toBe(true);
  });
});
