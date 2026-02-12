import logging

from algokit_utils import get_algod_client, get_indexer_client
#from algokit_utils.wallet_connect import WalletConnectAccount

logger = logging.getLogger(__name__)


def deploy() -> None:
    from smart_contracts.artifacts.sponsorship.sponsorship_client import SponsorshipFactory

    algod = get_algod_client()
    indexer = get_indexer_client()
    algorand = algokit_utils.AlgorandClient(algod=algod, indexer=indexer)

    # deployer = WalletConnectAccount(
    #     app_name="TrustPay",
    #     network="testnet"
    # )

    factory = algorand.client.get_typed_app_factory(
        SponsorshipFactory, default_sender=deployer.address
    )

    app_client, result = factory.deploy(
        on_update=algokit_utils.OnUpdate.UpdateApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )

    if result.operation_performed in [
        algokit_utils.OperationPerformed.Create,
        algokit_utils.OperationPerformed.Replace,
    ]:
        logger.info(
            f"Deployed Sponsorship app {app_client.app_id} to address {app_client.app_address}"
        )
