package test

import (
	"context"
	"testing"
	"time"

	"github.com/Azure/azure-sdk-for-go/services/compute/mgmt/2021-11-01/compute"
	"github.com/Azure/azure-sdk-for-go/services/storage/mgmt/2021-09-01/storage"
	"github.com/Azure/go-autorest/autorest/azure/auth"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTerraformVirtualMachineWindows(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../environments/dev",
		Vars: map[string]interface{}{
			"resource_type":       "virtual-machine-windows",
			"deployment_id":       "test-" + time.Now().Format("20060102150405"),
			"resource_group_name": "test-erdtree-rg",
			"vm_name":            "test-vm",
			"admin_username":     "testuser",
			"admin_password":     "TestPassword123!",
			"subscription_id":    getSubscriptionID(),
		},
	})

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	// Validate outputs
	resourceGroupName := terraform.Output(t, terraformOptions, "resource_group")
	assert.NotEmpty(t, resourceGroupName)

	vmOutput := terraform.OutputMap(t, terraformOptions, "virtual_machine_windows")
	assert.NotEmpty(t, vmOutput["name"])
	assert.NotEmpty(t, vmOutput["resource_id"])

	// Validate Azure resources exist
	validateWindowsVM(t, vmOutput["name"].(string), "test-erdtree-rg")
}

func TestTerraformVirtualMachineLinux(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../environments/dev",
		Vars: map[string]interface{}{
			"resource_type":       "virtual-machine-linux",
			"deployment_id":       "test-" + time.Now().Format("20060102150405"),
			"resource_group_name": "test-erdtree-linux-rg",
			"vm_name":            "test-linux-vm",
			"admin_username":     "testuser",
			"ssh_public_key":     "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDummy...",
			"subscription_id":    getSubscriptionID(),
		},
	})

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	// Validate outputs
	vmOutput := terraform.OutputMap(t, terraformOptions, "virtual_machine_linux")
	assert.NotEmpty(t, vmOutput["name"])
	assert.NotEmpty(t, vmOutput["resource_id"])

	// Validate Azure resources exist
	validateLinuxVM(t, vmOutput["name"].(string), "test-erdtree-linux-rg")
}

func TestTerraformStorageAccount(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../environments/dev",
		Vars: map[string]interface{}{
			"resource_type":        "storage-account",
			"deployment_id":        "test-" + time.Now().Format("20060102150405"),
			"resource_group_name":  "test-erdtree-storage-rg",
			"storage_account_name": "teststorage" + time.Now().Format("20060102150405"),
			"subscription_id":      getSubscriptionID(),
		},
	})

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	// Validate outputs
	storageOutput := terraform.OutputMap(t, terraformOptions, "storage_account")
	assert.NotEmpty(t, storageOutput["name"])
	assert.NotEmpty(t, storageOutput["resource_id"])

	// Validate Azure resources exist
	validateStorageAccount(t, storageOutput["name"].(string), "test-erdtree-storage-rg")
}

func validateWindowsVM(t *testing.T, vmName, resourceGroupName string) {
	subscriptionID := getSubscriptionID()
	
	authorizer, err := auth.NewAuthorizerFromEnvironment()
	require.NoError(t, err)

	vmClient := compute.NewVirtualMachinesClient(subscriptionID)
	vmClient.Authorizer = authorizer

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	vm, err := vmClient.Get(ctx, resourceGroupName, vmName, compute.InstanceViewTypesInstanceView)
	require.NoError(t, err)

	assert.Equal(t, vmName, *vm.Name)
	assert.Equal(t, "Windows", string(vm.StorageProfile.OsDisk.OsType))
}

func validateLinuxVM(t *testing.T, vmName, resourceGroupName string) {
	subscriptionID := getSubscriptionID()
	
	authorizer, err := auth.NewAuthorizerFromEnvironment()
	require.NoError(t, err)

	vmClient := compute.NewVirtualMachinesClient(subscriptionID)
	vmClient.Authorizer = authorizer

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	vm, err := vmClient.Get(ctx, resourceGroupName, vmName, compute.InstanceViewTypesInstanceView)
	require.NoError(t, err)

	assert.Equal(t, vmName, *vm.Name)
	assert.Equal(t, "Linux", string(vm.StorageProfile.OsDisk.OsType))
}

func validateStorageAccount(t *testing.T, storageAccountName, resourceGroupName string) {
	subscriptionID := getSubscriptionID()
	
	authorizer, err := auth.NewAuthorizerFromEnvironment()
	require.NoError(t, err)

	storageClient := storage.NewAccountsClient(subscriptionID)
	storageClient.Authorizer = authorizer

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	account, err := storageClient.GetProperties(ctx, resourceGroupName, storageAccountName, storage.Expand(""))
	require.NoError(t, err)

	assert.Equal(t, storageAccountName, *account.Name)
	assert.Equal(t, "Microsoft.Storage/storageAccounts", *account.Type)
}

func getSubscriptionID() string {
	// In real implementation, this would get from environment variables
	// For testing purposes, you would set ARM_SUBSCRIPTION_ID
	return "your-subscription-id-here"
}