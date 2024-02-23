# Steps to reproduce

1. `cdk deploy`
2. Update the container image registry on line 45 of hello_world_cdk_app-stack.ts to something else (eg `amazon/amazon-ecs-sample`)
3. `cdk deploy --hotswap`
