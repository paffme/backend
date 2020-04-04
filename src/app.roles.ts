export enum AppRoles {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  AUTHENTICATED = 'AUTHENTICATED',
  OWNER = 'OWNER',
}

/*
ac.grant(AppRoles.ANYONE)
  .readAny('registration')
  .readAny('competition')
  .readAny('competitionJuryPresident')
  .readAny('competitionJudge')
  .readAny('competitionChiefRouteSetter')
  .readAny('competitionRouteSetter')
  .readAny('competitionTechnicalDelegate');

ac.grant(AppRoles.UNAUTHENTICATED).createOwn('user');

ac.grant(AppRoles.AUTHENTICATED)
  .readOwn('user')
  .updateOwn('user')
  .deleteOwn('user')
  .createOwn('competition')
  .createOwn('registration')
  .deleteOwn('registration')
  .readOwn('juryPresidencies')
  .readOwn('judgements')
  .readOwn('chiefRouteSettings')
  .readOwn('routeSettings')
  .readOwn('technicalDelegations');

ac.grant(AppRoles.COMPETITION_OWNER)
  .updateOwn('competition')
  .deleteOwn('competition')
  .deleteAny('registration')
  .create('competitionJuryPresident')
  .delete('competitionJuryPresident')
  .create('competitionJudge')
  .delete('competitionJudge')
  .create('competitionChiefRouteSetter')
  .delete('competitionChiefRouteSetter')
  .create('competitionRouteSetter')
  .delete('competitionRouteSetter')
  .create('competitionTechnicalDelegate')
  .delete('competitionTechnicalDelegate');
*/
