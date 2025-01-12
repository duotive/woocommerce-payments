/**
 * Internal dependencies
 */
import {
	Elements,
	PaymentMethodMessagingElement,
} from '@stripe/react-stripe-js';
import { normalizeCurrencyToMinorUnit } from '../utils';
import { getUPEConfig } from 'wcpay/utils/checkout';
import { __ } from '@wordpress/i18n';
import './style.scss';
import { useEffect, useState } from '@wordpress/element';
import { getAppearance } from 'wcpay/checkout/upe-styles';

export default ( { api, upeConfig, upeName, upeAppearanceTheme } ) => {
	const cartData = wp.data.select( 'wc/store/cart' ).getCartData();
	const bnplMethods = [ 'affirm', 'afterpay_clearpay', 'klarna' ];
	const isTestMode = getUPEConfig( 'testMode' );
	const [ appearance, setAppearance ] = useState(
		getUPEConfig( 'wcBlocksUPEAppearance' )
	);

	// Stripe expects the amount to be sent as the minor unit of 2 digits.
	const amount = parseInt(
		normalizeCurrencyToMinorUnit(
			cartData.totals.total_price,
			cartData.totals.currency_minor_unit
		),
		10
	);

	// Customer's country or base country of the store.
	const currentCountry =
		cartData.billingAddress.country ||
		window.wcBlocksCheckoutData?.storeCountry ||
		'US';

	const isCreditCard = upeName === 'card';

	useEffect( () => {
		async function generateUPEAppearance() {
			// Generate UPE input styles.
			let upeAppearance = getAppearance( 'blocks_checkout', false );
			upeAppearance = await api.saveUPEAppearance(
				upeAppearance,
				'blocks_checkout'
			);
			setAppearance( upeAppearance );
		}

		if ( ! appearance ) {
			generateUPEAppearance();
		}
	}, [ api, appearance ] );

	return (
		<>
			<div className="payment-method-label">
				<span className="payment-method-label__label">
					{ upeConfig.title }
				</span>
				{ isCreditCard && isTestMode && (
					<span className="test-mode badge">
						{ __( 'Test Mode', 'woocommerce-payments' ) }
					</span>
				) }
				<img
					className="payment-methods--logos"
					src={
						upeAppearanceTheme === 'night'
							? upeConfig.darkIcon
							: upeConfig.icon
					}
					alt={ upeConfig.title }
				/>
			</div>
			{ bnplMethods.includes( upeName ) &&
				( upeConfig.countries.length === 0 ||
					upeConfig.countries.includes( currentCountry ) ) &&
				amount > 0 &&
				currentCountry &&
				appearance && (
					<div className="bnpl-message">
						<Elements
							stripe={ api.getStripeForUPE( upeName ) }
							options={ {
								appearance: appearance,
							} }
						>
							<PaymentMethodMessagingElement
								options={ {
									amount: amount || 0,
									currency:
										cartData.totals.currency_code || 'USD',
									paymentMethodTypes: [ upeName ],
									countryCode: currentCountry,
									displayType: 'promotional_text',
								} }
							/>
						</Elements>
					</div>
				) }
		</>
	);
};
