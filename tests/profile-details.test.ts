import {expect,test} from 'vitest';
import {ageFromDateOfBirth,emptyProfile,isProfile,legacyProfile,profileValidationError} from '@/lib/profile';
test('age changes on a birthday and rejects invalid/future dates',()=>{
  expect(ageFromDateOfBirth('2000-10-19',new Date(2026,9,18))).toBe(25);
  expect(ageFromDateOfBirth('2000-10-19',new Date(2026,9,19))).toBe(26);
  expect(ageFromDateOfBirth('2000-10-19',new Date(2026,9,20))).toBe(26);
  expect(ageFromDateOfBirth('2000-02-29',new Date(2026,1,28))).toBe(25);
  expect(ageFromDateOfBirth('2000-02-29',new Date(2026,2,1))).toBe(26);
  expect(ageFromDateOfBirth('2001-02-29',new Date(2026,9,19))).toBeNull();
  expect(ageFromDateOfBirth('2027-01-01',new Date(2026,9,19))).toBeNull();
  expect(ageFromDateOfBirth('',new Date(2026,9,19))).toBeNull();
});
test('legacy records remain valid and expanded scores respect their original scale',()=>{
  expect(isProfile({...legacyProfile,firstName:'Ada'})).toBe(true);
  expect(isProfile({...emptyProfile,graduationGradeType:'cgpa',graduationScore:'8.75',graduationScale:'10'})).toBe(true);
  expect(isProfile({...emptyProfile,class12GradeType:'percentage',class12Score:'100.1'})).toBe(false);
  expect(isProfile({...emptyProfile,graduationGradeType:'cgpa',graduationScore:'4.1',graduationScale:'4'})).toBe(false);
  expect(isProfile({...emptyProfile,graduationGradeType:'cgpa',graduationScore:'-1',graduationScale:'4'})).toBe(false);
  expect(isProfile({...emptyProfile,postalCode:'SW1A 1AA',about:'Study goals\nProjects'})).toBe(true);
});
test('unsafe links, malformed emails and non-string values are rejected',()=>{
  expect(isProfile({...emptyProfile,portfolioUrl:'javascript:alert(1)'})).toBe(false);
  expect(isProfile({...emptyProfile,email:'bad'})).toBe(false);
  expect(isProfile({...emptyProfile,dateOfBirth:20})).toBe(false);
  expect(profileValidationError({...emptyProfile,intakeYear:'xyz'})).toMatch(/four-digit/);
});
