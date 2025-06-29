const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to parse price strings
function parsePrice(priceString) {
    if (!priceString || priceString === '') return null;
    
    // Remove "Now ", "current price ", "$", and other text, keep only numbers and decimal
    const cleanPrice = priceString.replace(/[^0-9.]/g, '');
    const price = parseFloat(cleanPrice);
    
    return isNaN(price) ? null : price;
}

// Helper function to clean product names
function cleanProductName(name) {
    if (!name) return '';
    
    // Remove HTML entities and extra whitespace
    return name
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
}

// Helper function to determine category from product name
function categorizeProduct(name) {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('pasta') || lowerName.includes('macaroni') || lowerName.includes('spaghetti') || 
        lowerName.includes('fusilli') || lowerName.includes('penne') || lowerName.includes('lasagne')) {
        return 'Pasta';
    }
    if (lowerName.includes('bread') || lowerName.includes('bagel') || lowerName.includes('bun') || 
        lowerName.includes('loaf') || lowerName.includes('roll')) {
        return 'Bread & Bakery';
    }
    if (lowerName.includes('cereal') || lowerName.includes('chex')) {
        return 'Breakfast & Cereal';
    }
    if (lowerName.includes('cookie') || lowerName.includes('cracker')) {
        return 'Cookies & Crackers';
    }
    if (lowerName.includes('tortilla') || lowerName.includes('wrap') || lowerName.includes('pita')) {
        return 'Tortillas & Wraps';
    }
    if (lowerName.includes('chip') || lowerName.includes('snack') || lowerName.includes('bar')) {
        return 'Snacks';
    }
    if (lowerName.includes('pizza') || lowerName.includes('frozen')) {
        return 'Frozen Foods';
    }
    if (lowerName.includes('mix') || lowerName.includes('baking')) {
        return 'Baking Mixes';
    }
    if (lowerName.includes('sauce') || lowerName.includes('dressing') || lowerName.includes('dip')) {
        return 'Condiments & Sauces';
    }
    
    return 'Other';
}

async function importProductsFromCSV() {
    console.log('🚀 Starting product import from walmart.csv...');
    
    try {
        // First, let's create a default user if none exists
        let defaultUser = await prisma.user.findFirst();
        
        if (!defaultUser) {
            console.log('📝 Creating default user for imported products...');
            defaultUser = await prisma.user.create({
                data: {
                    email: 'admin@celiacapp.com',
                    name: 'System Admin',
                    password: 'temp_password_change_me' // This should be properly hashed in production
                }
            });
            console.log('✅ Default user created');
        }

        const products = [];
        const duplicateCheck = new Set();
        
        // Read and parse CSV file
        const csvData = await new Promise((resolve, reject) => {
            const results = [];
            
            fs.createReadStream('walmart.csv')
                .pipe(csv({
                    // The CSV doesn't have proper headers, so we'll map by position
                    headers: [
                        'url', 'productName', 'badge', 'imageUrl', 'addButton', 
                        'price', 'priceDisplay', 'unitPrice', 'brand', 'productNameClean',
                        'reviewCount', 'rating', 'deliveryInfo', 'deliveryIcon',
                        'pickupText', 'pickupAvailability', 'deliveryText', 'deliveryAvailability'
                    ],
                    skipFirstLine: true // Skip the header row
                }))
                .on('data', (data) => {
                    // Only process rows with valid product data
                    if (data.productName && data.productName !== '' && data.price && data.price !== '') {
                        results.push(data);
                    }
                })
                .on('end', () => {
                    resolve(results);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });

        console.log(`📊 Found ${csvData.length} products in CSV file`);

        // Process each product
        for (const row of csvData) {
            try {
                const productName = cleanProductName(row.productName || row.productNameClean);
                const brand = row.brand || 'Unknown';
                const price = parsePrice(row.price);
                
                // Skip if essential data is missing
                if (!productName || !price) {
                    continue;
                }
                
                // Create a unique key to avoid duplicates
                const uniqueKey = `${brand}-${productName}`.toLowerCase();
                if (duplicateCheck.has(uniqueKey)) {
                    console.log(`⚠️  Skipping duplicate: ${productName}`);
                    continue;
                }
                duplicateCheck.add(uniqueKey);
                
                const category = categorizeProduct(productName);
                
                const productData = {
                    name: productName,
                    category: category,
                    brand: brand,
                    isGlutenFree: true, // All products in this CSV are gluten-free
                    price: price,
                    notes: `Imported from Walmart Canada. URL: ${row.url || ''}`,
                    userId: defaultUser.id,
                    // We'll leave regularPrice and regularProductName empty for now
                    // These can be filled in later when users add comparison data
                    regularPrice: null,
                    regularProductName: null,
                    incrementalCost: null
                };
                
                products.push(productData);
                
            } catch (error) {
                console.error(`❌ Error processing row:`, error.message);
                continue;
            }
        }

        console.log(`📦 Preparing to insert ${products.length} unique products...`);

        // Insert products in batches to avoid overwhelming the database
        const batchSize = 50;
        let insertedCount = 0;
        
        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            
            try {
                await prisma.product.createMany({
                    data: batch,
                    skipDuplicates: true // Skip if product already exists
                });
                
                insertedCount += batch.length;
                console.log(`✅ Inserted batch ${Math.ceil((i + 1) / batchSize)} of ${Math.ceil(products.length / batchSize)} (${insertedCount}/${products.length} products)`);
                
            } catch (error) {
                console.error(`❌ Error inserting batch ${Math.ceil((i + 1) / batchSize)}:`, error.message);
                // Continue with next batch even if one fails
            }
        }

        console.log('🎉 Import completed!');
        console.log(`📊 Final Summary:`);
        console.log(`   • Total products processed: ${csvData.length}`);
        console.log(`   • Unique products prepared: ${products.length}`);
        console.log(`   • Products inserted: ${insertedCount}`);
        
        // Show some sample products by category
        const categoryCounts = {};
        products.forEach(p => {
            categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
        });
        
        console.log(`\n📈 Products by Category:`);
        Object.entries(categoryCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, count]) => {
                console.log(`   • ${category}: ${count} products`);
            });

    } catch (error) {
        console.error('❌ Import failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the import
if (require.main === module) {
    importProductsFromCSV()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { importProductsFromCSV };
