








//==>Follow METHODS
UserRouter.post('/followUser', auth, us.followUser);
UserRouter.delete('/unfollowUser', auth, us.unfollowUser);