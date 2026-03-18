#pragma once
#include "httplib.h"
#include "comments.h"

void setupRoutes(httplib::Server& svr, CommentStore& commentStore);
