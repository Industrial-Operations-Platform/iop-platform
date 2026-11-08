const { personalUsername, prepare } = require('./access/rename-usernames.cjs');
test('first name and first surname produce a case-insensitive ASCII login', () => {
  expect(personalUsername('  Alex Rivera Torres  ')).toBe('alexrivera');
  expect(personalUsername('ALEX RIVERA')).toBe('alexrivera');
  expect(personalUsername('André Müller')).toBe('andremueller');
  expect(personalUsername('Anna Kiliç')).toBe('annakilic');
  expect(personalUsername('Jane O’Neil')).toBe('janeoneil');
  expect(personalUsername('Administrator')).toBeNull();
  expect(() => personalUsername('Alex 👤')).toThrow('explicit ASCII');
});
const row = (userId, username, name, visible = true) => ({ organizationId: 'org', userId, username, name, visible, fingerprint: 'fingerprint' });
test('planning preserves existing canonical names and system accounts and is idempotent', () => {
  const users = [row('a','fixture.1','Alex Rivera'), row('b','samjones','Sam Jones'), row('c','admin','Administrator')];
  const plan = prepare(users);
  expect(plan.changes).toEqual([{...users[0], next:'alexrivera'}]);
  expect(plan.skipped).toEqual([{userId:'c',username:'admin'}]);
  expect(prepare(users.map(user => ({...user,username:plan.changes.find(change => change.userId===user.userId)?.next??user.username}))).changes).toEqual([]);
});
test('duplicate personal names or a reserved deleted username stop the entire plan', () => {
  expect(() => prepare([row('a','fixture.1','Alex Rivera'), row('b','fixture.2','Alex Rivera')])).toThrow('conflict');
  expect(() => prepare([row('a','fixture.1','Alex Rivera'), row('b','alexrivera','Other Person',false)])).toThrow('conflict');
  expect(prepare([row('a','fixture.1','Alex Rivera'), {...row('b','fixture.1','Alex Rivera'), organizationId:'other'}]).changes).toHaveLength(2);
});
