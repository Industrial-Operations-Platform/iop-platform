import {siteRoles, profileSiteRoles, type Profile} from '../src/modules/users-rbac/domain/profiles';
import {decideSiteAccess} from '../src/modules/users-rbac/domain/authorization';
const target={organizationId:'org-a',siteId:'site-a',userId:'person-a'};
function allowed(profile:Profile,permission:string,active=true) {
  return decideSiteAccess({...target,permissions:[permission]},siteRoles(profile).map(roleId=>({roleId,userActive:active,membershipActive:active})));
}
describe('owner-authorized advanced functions',()=>{
  test.each(['administrator','team-leader','task-force'] as Profile[])('%s receives explicit operational permissions',profile=>{
    for(const permission of ['handover.records.manage','improvement.read','improvement.contribute','improvement.coordinate','locator.read'])
      expect(allowed(profile,permission)).toEqual({allowed:true});
    expect(allowed(profile,'integrations.read').allowed).toBe(profile==='administrator');
    expect(allowed(profile,'integrations.manage').allowed).toBe(profile==='administrator');
    expect(allowed(profile,'locator.manage').allowed).toBe(profile==='administrator');
  });
  test('Technician retains journal contribution without advanced grants',()=>{
    expect(allowed('technician','handover.contribute')).toEqual({allowed:true});
    for(const permission of ['handover.records.manage','improvement.read','locator.read','integrations.read'])
      expect(allowed('technician',permission).allowed).toBe(false);
  });
  test('inactive membership denies newly granted functions and the complete catalog supports revocation',()=>{
    expect(allowed('administrator','improvement.read',false).allowed).toBe(false);
    for(const role of ['handover-record-manager','improvement-coordinator','locator-manager','integration-manager'])
      expect(profileSiteRoles).toContain(role);
  });
});
