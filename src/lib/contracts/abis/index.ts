// Basic ERC721 ABI for collection interaction
export const ERC721_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)"
]

// Basic ERC1155 ABI for collection interaction
export const ERC1155_ABI = [
  "function uri(uint256 id) view returns (string)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
  "function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)",
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)",
  "event ApprovalForAll(address indexed account, address indexed operator, bool approved)",
  "event URI(string value, uint256 indexed id)"
]

// Collection Factory ABI (simplified)
export const COLLECTION_FACTORY_ABI = [
  "function createERC721Collection(string name, string symbol, string baseURI) returns (address)",
  "function createERC1155Collection(string name, string symbol, string baseURI) returns (address)",
  "function getCollectionsByCreator(address creator) view returns (address[])",
  "function isValidCollection(address collection) view returns (bool)",
  "event ERC721CollectionCreated(address indexed creator, address indexed collection, string name, string symbol)",
  "event ERC1155CollectionCreated(address indexed creator, address indexed collection, string name, string symbol)"
]

// NFT Exchange ABI (simplified)
export const NFT_EXCHANGE_ABI = [
  "function createListing(address tokenContract, uint256 tokenId, uint256 price, address currency) returns (uint256)",
  "function buyListing(uint256 listingId) payable",
  "function cancelListing(uint256 listingId)",
  "function updateListingPrice(uint256 listingId, uint256 newPrice)",
  "function getListing(uint256 listingId) view returns (tuple(address seller, address tokenContract, uint256 tokenId, uint256 price, address currency, bool active))",
  "function getActiveListings() view returns (uint256[])",
  "function getListingsByUser(address user) view returns (uint256[])",
  "event ListingCreated(uint256 indexed listingId, address indexed seller, address indexed tokenContract, uint256 tokenId, uint256 price)",
  "event ListingSold(uint256 indexed listingId, address indexed buyer, uint256 price)",
  "event ListingCancelled(uint256 indexed listingId)"
]

// Auction Factory ABI (simplified)
export const AUCTION_FACTORY_ABI = [
  "function createEnglishAuction(address tokenContract, uint256 tokenId, uint256 startPrice, uint256 duration) returns (uint256)",
  "function createDutchAuction(address tokenContract, uint256 tokenId, uint256 startPrice, uint256 endPrice, uint256 duration) returns (uint256)",
  "function placeBid(uint256 auctionId) payable",
  "function claimAuction(uint256 auctionId)",
  "function getAuction(uint256 auctionId) view returns (tuple(address seller, address tokenContract, uint256 tokenId, uint256 startPrice, uint256 currentPrice, uint256 endTime, address highestBidder, bool active))",
  "event AuctionCreated(uint256 indexed auctionId, address indexed seller, address indexed tokenContract, uint256 tokenId, uint256 startPrice)",
  "event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount)",
  "event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 finalPrice)"
]

// Offer Manager ABI (simplified)
export const OFFER_MANAGER_ABI = [
  "function makeOffer(address tokenContract, uint256 tokenId, uint256 price, uint256 expiresAt) payable returns (uint256)",
  "function acceptOffer(uint256 offerId)",
  "function cancelOffer(uint256 offerId)",
  "function getOffer(uint256 offerId) view returns (tuple(address offerer, address tokenContract, uint256 tokenId, uint256 price, uint256 expiresAt, bool active))",
  "function getOffersByUser(address user) view returns (uint256[])",
  "function getOffersForToken(address tokenContract, uint256 tokenId) view returns (uint256[])",
  "event OfferMade(uint256 indexed offerId, address indexed offerer, address indexed tokenContract, uint256 tokenId, uint256 price)",
  "event OfferAccepted(uint256 indexed offerId, address indexed acceptor)",
  "event OfferCancelled(uint256 indexed offerId)"
]

// Bundle Manager ABI (simplified)
export const BUNDLE_MANAGER_ABI = [
  "function createBundle(address[] tokenContracts, uint256[] tokenIds, uint256[] amounts, uint256 price) returns (uint256)",
  "function buyBundle(uint256 bundleId) payable",
  "function cancelBundle(uint256 bundleId)",
  "function getBundle(uint256 bundleId) view returns (tuple(address seller, address[] tokenContracts, uint256[] tokenIds, uint256[] amounts, uint256 price, bool active))",
  "event BundleCreated(uint256 indexed bundleId, address indexed seller, uint256 price)",
  "event BundleSold(uint256 indexed bundleId, address indexed buyer)",
  "event BundleCancelled(uint256 indexed bundleId)"
]

// Collection Verifier ABI (simplified)
export const COLLECTION_VERIFIER_ABI = [
  "function verifyCollection(address collection, string metadataURI)",
  "function revokeVerification(address collection)",
  "function isVerified(address collection) view returns (bool)",
  "function getVerificationDetails(address collection) view returns (tuple(bool verified, string metadataURI, uint256 verifiedAt))",
  "event CollectionVerified(address indexed collection, string metadataURI)",
  "event VerificationRevoked(address indexed collection)"
]

// Fee Manager ABI (simplified)
export const FEE_MANAGER_ABI = [
  "function setMarketplaceFee(uint256 feePercentage)",
  "function setRoyaltyFee(uint256 feePercentage)",
  "function getMarketplaceFee() view returns (uint256)",
  "function getRoyaltyFee() view returns (uint256)",
  "function calculateFees(uint256 price) view returns (uint256 marketplaceFee, uint256 royaltyFee)",
  "event MarketplaceFeeUpdated(uint256 newFee)",
  "event RoyaltyFeeUpdated(uint256 newFee)"
]

// Access Control ABI (simplified)
export const ACCESS_CONTROL_ABI = [
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function grantRole(bytes32 role, address account)",
  "function revokeRole(bytes32 role, address account)",
  "function getRoleAdmin(bytes32 role) view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function ADMIN_ROLE() view returns (bytes32)",
  "function VERIFIED_CREATOR_ROLE() view returns (bytes32)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)"
]

// Emergency Manager ABI (simplified)
export const EMERGENCY_MANAGER_ABI = [
  "function pauseMarketplace()",
  "function unpauseMarketplace()",
  "function emergencyWithdraw(address token, uint256 amount)",
  "function blacklistContract(address contractAddress)",
  "function removeFromBlacklist(address contractAddress)",
  "function isContractBlacklisted(address contractAddress) view returns (bool)",
  "function isPaused() view returns (bool)",
  "event MarketplacePaused()",
  "event MarketplaceUnpaused()",
  "event ContractBlacklisted(address indexed contractAddress)",
  "event ContractRemovedFromBlacklist(address indexed contractAddress)"
]

// Export all ABIs as a collection
export const ABIS = {
  ERC721: ERC721_ABI,
  ERC1155: ERC1155_ABI,
  COLLECTION_FACTORY: COLLECTION_FACTORY_ABI,
  NFT_EXCHANGE: NFT_EXCHANGE_ABI,
  AUCTION_FACTORY: AUCTION_FACTORY_ABI,
  OFFER_MANAGER: OFFER_MANAGER_ABI,
  BUNDLE_MANAGER: BUNDLE_MANAGER_ABI,
  COLLECTION_VERIFIER: COLLECTION_VERIFIER_ABI,
  FEE_MANAGER: FEE_MANAGER_ABI,
  ACCESS_CONTROL: ACCESS_CONTROL_ABI,
  EMERGENCY_MANAGER: EMERGENCY_MANAGER_ABI,
}