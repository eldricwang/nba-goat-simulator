#pragma once
#include "httplib.h"
#include "comments.h"
#include "auth.h"

void setupRoutes(httplib::Server& svr, CommentStore& commentStore, UserStore& userStore);
