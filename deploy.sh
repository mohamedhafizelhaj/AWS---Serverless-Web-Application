#!/usr/bin/env bash

# parse the arguments

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 frontend-bucket lambda-bucket [--stack-name myStack]"
    exit 1
fi

FRONTEND=$1
LAMBDA=$2
shift 2

OPTION_VALUE=""
STACK_NAME="Serverless-Web-Application"

while [ $# -gt 0 ]; do
  case "$1" in
    --stack-name)
      if [ -n "$2" ] && [ "${2:0:1}" != "-" ]; then
        OPTION_VALUE="$2"
        shift
      else
        echo "Error: --stack-name requires a value" >&2
        exit 1
      fi
      ;;
    *)
      echo "Invalid option: $1" >&2
      exit 1
      ;;
  esac
  shift
done

if [ -n "$OPTION_VALUE" ]; then
  STACK_NAME=$OPTION_VALUE
fi

# create an s3 bucket for lambda functions
aws s3 mb s3://$LAMBDA

# install lambda functions' dependencies, archive them, and upload them
ORIGINAL_DIR=$(pwd)

declare -A DIRECTORIES

DIRECTORIES=(
    ["authorizers-layer.zip"]="./backend/Layers/Authorizers"
    ["business-core-layer.zip"]="./backend/Layers/Core"
    ["customer-authorizer.zip"]="./backend/Authorizers/Customer-authorizer"
    ["organizer-authorizer.zip"]="./backend/Authorizers/Organizer-authorizer"
    ["global-authorizer.zip"]="./backend/Authorizers/Global-authorizer"
    ["create-event.zip"]="./backend/Events/Create-event"
    ["delete-event.zip"]="./backend/Events/Delete-event"
    ["get-events.zip"]="./backend/Events/Get-events"
    ["update-event.zip"]="./backend/Events/Update-event"
    ["send-email.zip"]="./backend/SendEmails"
    ["get-my-tickets.zip"]="./backend/Tickets/Get-my-tickets"
    ["get-ticket-info.zip"]="./backend/Tickets/Get-ticket-info"
    ["pay-for-ticket.zip"]="./backend/Tickets/Pay-for-ticket"
    ["auto-confirm.zip"]="./backend/Cognito/Pre-signup"
    ["add-user-role.zip"]="./backend/Cognito/Pre-token-generation"
    ["create-events-table.zip"]="./backend/ApplicationSetup/Create-events-table"
    ["create-tickets-table.zip"]="./backend/ApplicationSetup/Create-tickets-table"
    ["insert-sample-events.zip"]="./backend/ApplicationSetup/insert-sample-events"
)

for KEY in "${!DIRECTORIES[@]}"; do
    
    DIR=${DIRECTORIES[$KEY]}
    cd $DIR

    if [ "$(jq .dependencies package.json)" != "{}" ]; then
        echo "Running npm install in $DIR"
        npm install --silent
    fi

    echo "Creating zip file $KEY"
    zip -r "$KEY" node_modules index.js package.json package-lock.json > /dev/null

    aws s3 cp "$KEY" s3://$LAMBDA
    cd "$ORIGINAL_DIR"

done

echo "Lambda bucket created and functions uploaded"

# deploy the solution
echo "deploying the solution..."

aws cloudformation create-stack --stack-name $STACK_NAME --template-body file://template.yaml --parameters ParameterKey=FrontEndBucket,ParameterValue=$FRONTEND ParameterKey=LambdaBucket,ParameterValue=$LAMBDA > /dev/null
echo "deployment process initiated for the stack $STACK_NAME"

STATUS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME | jq -r .Stacks[0].StackStatus)

if [ "$STATUS" = "CREATE_IN_PROGRESS" ]; then
  echo "Waiting for the stack to deploy..."
fi

while [ "$STATUS" = "CREATE_IN_PROGRESS" ]
do
  sleep 15
  STATUS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME | jq -r .Stacks[0].StackStatus)
done

if [ "$STATUS" != "CREATE_COMPLETE" ]; then
  echo "An error occurred, check the details:"
  aws cloudformation describe-stacks --stack-name $STACK_NAME
  exit 1
fi

echo "The stack deployed successfully"

echo "Verifying SES email identity..."
aws ses verify-email-identity --email-address "mohhafiz001@gmail.com"

STACK_DETAILS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME)

API_ENDPOINT=$(echo $STACK_DETAILS | jq -r '.Stacks[0].Outputs[] | select(.OutputKey == "APIEndpoint") | .OutputValue')
CLOUDFRONT_DISTRIBUTION=$(echo $STACK_DETAILS | jq -r '.Stacks[0].Outputs[] | select(.OutputKey == "CloudFrontDistributionDomainName") | .OutputValue')
COGNITO_USER_POOL_CLIENT_ID=$(echo $STACK_DETAILS | jq -r '.Stacks[0].Outputs[] | select(.OutputKey == "CognitoUserPoolClientID") | .OutputValue')

echo "Updating frontend files with the appropriate URLs..."

declare -A FRONTEND_FILES

FRONTEND_FILES=(
    ["./frontend/events.html"]="API_ENDPOINT"
    ["./frontend/login.html"]="COGNITO_USER_POOL_CLIENT_ID"
    ["./frontend/payment.html"]="API_ENDPOINT"
    ["./frontend/signup.html"]="COGNITO_USER_POOL_CLIENT_ID"
    ["./frontend/tickets.html"]="API_ENDPOINT"
)

for MYPATH in "${!FRONTEND_FILES[@]}"; do

    if [ "${FRONTEND_FILES[$MYPATH]}" = "API_ENDPOINT" ]; then
      sed -i "s|const API = \".*\";|const API = \"$API_ENDPOINT\";|" $MYPATH
    fi

    if [ "${FRONTEND_FILES[$MYPATH]}" = "COGNITO_USER_POOL_CLIENT_ID" ]; then
      sed -i "s|const ClientId = \".*\";|const ClientId = \"$COGNITO_USER_POOL_CLIENT_ID\";|" $MYPATH
    fi

done

echo "Uploading frontend files to their bucket..."
aws s3 cp ./frontend s3://$FRONTEND --recursive

echo "You can access the solution using this CloudFront distribution URL: $CLOUDFRONT_DISTRIBUTION"