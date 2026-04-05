const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let cachedCompanyId = null;

async function getDhsCourierId() {
    if (cachedCompanyId) return cachedCompanyId;

    let company = await prisma.courierCompany.findFirst();
    if (!company) {
        // No company exists, throw error for system initialization
        throw new Error("System Initialization Required: No CourierCompany found. Please create a company record first.");
    }
    cachedCompanyId = company.id;
    return cachedCompanyId;
}

module.exports = { getDhsCourierId };